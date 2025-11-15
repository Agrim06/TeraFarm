# TeraFarm - Smart Irrigation System

> An intelligent IoT-based irrigation system that combines real-time sensor monitoring, machine learning predictions, and automated pump control to optimize water usage in agricultural applications.

![TeraFarm Dashboard]
![WhatsApp Image 2025-11-15 at 22 03 12_e8aecc7c](https://github.com/user-attachments/assets/6789265b-5ab1-4bc3-8d13-64c3cc277cc0)
![WhatsApp Image 2025-11-15 at 22 04 14_8eb3c4bb](https://github.com/user-attachments/assets/df1df843-1876-4372-8ba6-1057b75db6cb)
![WhatsApp Image 2025-11-15 at 22 03 45_46219ce2](https://github.com/user-attachments/assets/b62cb3a2-5548-4a52-869e-1cf93f3b159f)
![WhatsApp Image 2025-11-15 at 22 04 03_c57c1613](https://github.com/user-attachments/assets/4e8029c2-7473-470f-b105-c10d43a871f4)


## 🌟 Features

- **Real-time Sensor Monitoring**: Collects soil moisture, temperature, and humidity data from ESP8266/ESP32 devices
- **Machine Learning Predictions**: Uses trained Random Forest models to predict optimal irrigation amounts and timing
- **Automated Pump Control**: ESP devices automatically fetch predictions and control irrigation pumps
- **Interactive Dashboard**: React-based web interface with live data visualization, charts, and historical data
- **Alert System**: Real-time notifications for pump activations and irrigation events
- **Multi-device Support**: Monitor and control multiple irrigation zones simultaneously

## 🏗️ Architecture

TeraFarm consists of four main components:

### 1. **Backend** (`/backend`)
- Node.js/Express REST API
- MongoDB database for data persistence
- Handles sensor data ingestion, prediction storage, and alert management
- RESTful endpoints for frontend and ESP device communication

### 2. **Frontend** (`/frontend`)
- React application with Vite
- Real-time dashboard with live sensor data visualization
- Interactive charts for moisture trends
- Historical data tables and prediction cards
- Dark/light theme support

### 3. **ML Service** (`/ml-service`)
- Python/FastAPI service
- Random Forest models for water amount and pump time predictions
- Preprocessing pipeline for feature engineering
- Model training and inference endpoints

### 4. **ESP Firmware** (`/esp_codes`)
- Arduino/ESP8266 firmware
- Sensor reading (DHT11, soil moisture)
- HTTP communication with backend
- Automated pump control based on ML predictions
- OLED display for local status monitoring

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **Python** (3.8 or higher)
- **MongoDB** (running locally or remote instance)
- **Arduino IDE** (for ESP firmware)
- **ESP8266/ESP32** development board
- **DHT11** temperature/humidity sensor
- **Soil moisture sensor** (analog)
- **Water pump** with relay module
- **OLED display** (optional, for local monitoring)

## 🚀 Installation

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=mongodb://localhost:27017/irrigation_db
PORT=5000
```

Start the backend server:
```bash
node server.js
```

The API will be available at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
```

Update the API endpoint in `src/api/backend.js` if needed.

Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
```

Start the FastAPI service:
```bash
python -m api.main
```

Or use the provided batch file (Windows):
```bash
runapi.bat
```

The ML service will be available at `http://localhost:8000`

### ESP Firmware Setup

1. Open `esp_codes/esp.ino` in Arduino IDE
2. Install required libraries:
   - ESP8266WiFi
   - ESP8266HTTPClient
   - ArduinoJson
   - DHT sensor library
   - U8g2lib (for OLED)
3. Update WiFi credentials in the code:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
4. Update backend URL:
   ```cpp
   String baseURL = "http://YOUR_BACKEND_IP:5000";
   ```
5. Upload to your ESP8266/ESP32 device

## 📡 API Endpoints

### Sensor Data
- `POST /api/sensors/data` - Submit sensor readings
- `GET /api/sensors/latest?deviceId={id}` - Get latest sensor reading
- `GET /api/sensors?deviceId={id}&limit={n}` - Get sensor history

### Predictions
- `POST /api/prediction/:deviceId` - Create new prediction
- `GET /api/prediction/:deviceId` - Get latest unused prediction (for ESP)
- `POST /api/prediction/mark-used/:deviceId` - Mark prediction as used
- `GET /api/predictions/latest?deviceId={id}` - Get latest prediction (for frontend)
- `GET /api/predictions?deviceId={id}&limit={n}` - Get prediction history

### Alerts
- `GET /api/alerts?deviceId={id}&limit={n}` - Get alerts
- `GET /api/alerts/latest?deviceId={id}` - Get latest alert
- `POST /api/alerts/:alertId/read` - Mark alert as read
- `POST /api/alerts/read-all` - Mark all alerts as read

### ML Service
- `POST /predict` - Get irrigation prediction from ML model

## 🔧 Configuration

### Device Configuration
- Update `deviceId` in ESP firmware to uniquely identify each device
- Configure sensor pins and pump control pins in `esp.ino`
- Adjust measurement intervals as needed

### ML Model Training
To retrain the models:
```bash
cd ml-service
python -m models.train
```

Models are saved in `ml-service/models/models/` directory.

## 📊 Data Flow

1. **Sensor Reading**: ESP device reads soil moisture, temperature, and humidity
2. **Data Transmission**: ESP sends sensor data to backend API
3. **ML Prediction**: Backend (or scheduled job) calls ML service to generate irrigation predictions
4. **Prediction Storage**: Predictions are stored in MongoDB
5. **Pump Control**: ESP device fetches latest unused prediction and controls pump accordingly
6. **Visualization**: Frontend dashboard displays real-time data and historical trends

## 🛠️ Technologies Used

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite, CSS3
- **ML Service**: Python, FastAPI, scikit-learn, XGBoost, pandas
- **IoT**: Arduino, ESP8266, DHT11, analog sensors
- **Data Storage**: MongoDB

## 📝 Project Structure

```
TeraFarm/
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── config/      # Database and environment config
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   └── server.js        # Entry point
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Page components
│   │   └── api/        # API client
│   └── package.json
├── ml-service/          # Python ML service
│   ├── api/            # FastAPI application
│   ├── models/         # ML models and training
│   ├── preprocess/     # Data preprocessing
│   ├── data/           # Training datasets
│   └── src/            # Prediction logic
└── esp_codes/          # Arduino firmware
    └── esp.ino         # Main firmware file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributors
   {-} Agrim  https://github.com/Agrim06/
   {-} Lakshya https://github.com/Lxxtz
   {-} Krish https://github.com/k1o1r1o1u1/
   {-} Vansh https://github.com/Vansh-Rathore-ui/

## 🙏 Acknowledgments

- Thanks to all contributors and the open-source community

---

**Note**: Remember to update the screenshot placeholder above with an actual dashboard screenshot once available.
