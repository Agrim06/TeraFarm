#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <U8g2lib.h>
#include <Wire.h>
#include <time.h>

// ---------------- OLED DISPLAY ----------------
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(
    U8G2_R0, /* reset=*/ U8X8_PIN_NONE);

// ---------------- SENSORS ----------------
#define DHTPIN D4
#define DHTTYPE DHT11
#define SOIL_PIN A0
DHT dht(DHTPIN, DHTTYPE);

// ---------------- PUMP ----------------
#define PUMP_PIN D5
#define PUMP_ON HIGH
#define PUMP_OFF LOW

// ---------------- MANUAL INTERRUPT PIN ----------------
// Short D6 to GND to immediately stop pump (demo mode)
#define INTERRUPT_PIN D6

// ---------------- WIFI ----------------
const char* ssid = "S23_net";
const char* password = "korou1121.,.,";

// ---------------- BACKEND URLS ----------------
const char* deviceId = "device_01";
String baseURL = "http://10.33.39.81:5000";

String postSensorURL    = baseURL + "/api/sensors/data";
String getPredictionURL = baseURL + "/api/prediction/" + deviceId;
String markUsedURL      = baseURL + "/api/prediction/mark-used/" + deviceId;

// ---------------- TIMERS ----------------
unsigned long lastMeasure = 0;
unsigned long lastSend = 0;
unsigned long lastFetch = 0;

unsigned long measureInterval = 1000;
unsigned long sendInterval = 2000;
unsigned long predictionInterval = 6000;

// ---------------- SENSOR VALUES ----------------
float t = 0;
float h = 0;
int soil = 0;

// ---------------- PREDICTION VALUES ----------------
float predictedWaterMM = 0;
float predictedPumpSec = 0;
String predictionId = "";

bool pumpRunning = false;
unsigned long pumpStartTime = 0;

// =============================================================
//                     WIFI CONNECT
// =============================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[WIFI] Connecting...");
  WiFi.begin(ssid, password);
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - start < 8000) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] CONNECTED ✓");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());

    configTime(19800, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println("[WIFI] FAILED ✗");
  }
}

// =============================================================
//                     GET CURRENT TIME
// =============================================================
String getISOTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "1970-01-01T00:00:00Z";

  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// =============================================================
//                     READ SENSOR VALUES
// =============================================================
void readSensors() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();

  int raw = analogRead(SOIL_PIN);
  int soilPercent = map(raw, 610, 1023, 100, 0);
  soilPercent = constrain(soilPercent, 0, 100);

  if (!isnan(temp)) t = temp;
  if (!isnan(hum)) h = hum;
  soil = soilPercent;

  Serial.printf("[SENSOR] T=%.1f°C  H=%.1f%%  S=%d%%\n", t, h, soil);
}

// =============================================================
//                     SEND SENSOR DATA
// =============================================================
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<200> doc;
  doc["deviceId"] = deviceId;
  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["moisture"] = soil;
  doc["timestamp"] = getISOTime();

  char payload[200];
  serializeJson(doc, payload);

  Serial.print("[UPLOAD] ");
  Serial.println(payload);

  WiFiClient client;
  HTTPClient http;

  http.begin(client, postSensorURL);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST((uint8_t*)payload, strlen(payload));
  Serial.printf("[UPLOAD] Status: %d\n", code);

  if (code > 0) {
    Serial.println("[UPLOAD] Server:");
    Serial.println(http.getString());
  }

  http.end();
}

// =============================================================
//                     FETCH PREDICTION
// =============================================================
void fetchPrediction() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  http.begin(client, getPredictionURL);
  int code = http.GET();
  Serial.printf("[PREDICT] GET %d\n", code);

  if (code != 200) {
    http.end();
    return;
  }

  String response = http.getString();
  http.end();

  Serial.println("[PREDICT] Raw:");
  Serial.println(response);

  StaticJsonDocument<300> doc;
  if (deserializeJson(doc, response)) {
    Serial.println("[PREDICT] JSON ERROR");
    return;
  }

  if (!doc["success"]) {
    Serial.println("[PREDICT] No prediction");
    return;
  }

  predictedWaterMM = doc["waterMM"].as<float>();
  predictedPumpSec = doc["pumpTimeSec"].as<float>();
  predictionId     = doc["predictionId"].as<String>();

  Serial.printf("[PREDICT] Water=%.1fmm | Pump=%.1fs\n",
                predictedWaterMM, predictedPumpSec);
}

// =============================================================
//                     MARK PREDICTION USED
// =============================================================
void markUsed() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;

  http.begin(client, markUsedURL);
  int code = http.POST("");
  Serial.printf("[USED] Marked (Code %d)\n", code);
  http.end();
}

// =============================================================
//                     OLED UI
// =============================================================
void updateOLED() {
  u8g2.clearBuffer();
  u8g2.setFont(u8g2_font_6x10_tf);

  char buf[40];

  if (WiFi.status() == WL_CONNECTED)
    u8g2.drawStr(2, 14, "Connected");
  else
    u8g2.drawStr(2, 14, "Offline");

  u8g2.drawHLine(0, 20, 128);

  sprintf(buf, "T:%.1fC  H:%.0f%%  S:%d%%", t, h, soil);
  u8g2.drawStr(2, 36, buf);

  u8g2.drawHLine(0, 40, 128);

  if (pumpRunning) {
    int secLeft =
        (predictedPumpSec * 1000 - (millis() - pumpStartTime)) / 1000;

    sprintf(buf, "Pump RUN (%ds)", max(0, secLeft));
    u8g2.drawStr(2, 54, buf);

    sprintf(buf, "Need: %.1f mm", predictedWaterMM);
    u8g2.drawStr(2, 64, buf);
  } else {
    u8g2.drawStr(2, 56, "Pump Status: Idle");
  }

  u8g2.sendBuffer();
}

// =============================================================
//                     SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.begin(D2, D1);
  u8g2.begin();

  dht.begin();

  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, LOW);

  // Manual interrupt
  pinMode(INTERRUPT_PIN, INPUT_PULLUP);

  connectWiFi();
}

// =============================================================
//                     LOOP
// =============================================================
void loop() {
  connectWiFi();
  unsigned long now = millis();

  if (now - lastMeasure > measureInterval) {
    lastMeasure = now;
    readSensors();
  }

  if (now - lastSend > sendInterval) {
    lastSend = now;
    sendSensorData();
  }

  if (now - lastFetch > predictionInterval) {
    lastFetch = now;
    fetchPrediction();
  }

  // ===================================================
  //        MANUAL INTERRUPT LOGIC (DEMO MODE)
  // ===================================================
  if (pumpRunning && digitalRead(INTERRUPT_PIN) == LOW) {
    Serial.println("[INTERRUPT] Pump stopped manually!");

    digitalWrite(PUMP_PIN, LOW);
    pumpRunning = false;

    markUsed();
    predictedPumpSec = 0;

    updateOLED();
    delay(500);
  }

  // ===================================================
  //                   NORMAL PUMP START
  // ===================================================
  if (!pumpRunning && predictedPumpSec > 0.1) {
    pumpRunning = true;
    pumpStartTime = now;
    digitalWrite(PUMP_PIN, HIGH);
    Serial.printf("[PUMP] ON for %.1fs\n", predictedPumpSec);
  }

  // ===================================================
  //                   NORMAL PUMP STOP
  // ===================================================
  if (pumpRunning && now - pumpStartTime > predictedPumpSec * 1000) {
    digitalWrite(PUMP_PIN, LOW);
    pumpRunning = false;
    Serial.println("[PUMP] OFF");

    markUsed();
    predictedPumpSec = 0;
  }

  updateOLED();
  delay(120);
}
