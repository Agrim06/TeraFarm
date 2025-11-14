const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// MongoDB
// -------------------------------
mongoose.connect('mongodb://localhost:27017/irrigation_db')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("DB ERROR:", err));


// -------------------------------
// Sensor Data Schema
// -------------------------------
const sensorSchema = new mongoose.Schema({
  deviceId: String,
  temperature: Number,
  humidity: Number,
  moisture: Number,
  timestamp: Date
});
const SensorData = mongoose.model('SensorData', sensorSchema);


// -------------------------------
// Prediction Schema
// -------------------------------
const predictionSchema = new mongoose.Schema({
  deviceId: String,
  waterMM: Number,
  pumpTimeSec: Number,
  predictionId: String,
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Prediction = mongoose.model("Prediction", predictionSchema);


// =====================================================================
// 1️⃣ Save Sensor Data
// =====================================================================
app.post("/api/sensors/data", async (req, res) => {
  try {
    const entry = new SensorData({
      deviceId: req.body.deviceId,
      temperature: req.body.temperature,
      humidity: req.body.humidity,
      moisture: req.body.moisture,
      timestamp: new Date(req.body.timestamp)
    });

    await entry.save();
    res.json({ success: true });
  } 
  catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// =====================================================================
// 2️⃣ Add Prediction (from ML model or manual)
// =====================================================================
app.post("/api/prediction/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { waterMM, pumpTimeSec } = req.body;

    const prediction = new Prediction({
      deviceId,
      waterMM,
      pumpTimeSec,
      predictionId: new Date().toISOString(),
      used: false
    });

    await prediction.save();
    res.json({ success: true, prediction });
  }
  catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// =====================================================================
// 3️⃣ ESP Fetches Latest *Unused* Prediction
// =====================================================================
app.get("/api/prediction/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const latest = await Prediction.findOne({
      deviceId,
      used: false
    }).sort({ createdAt: -1 });

    if (!latest) {
      return res.json({ success: false, error: "No active prediction" });
    }

    res.json({
      success: true,
      waterMM: latest.waterMM,
      pumpTimeSec: latest.pumpTimeSec,
      predictionId: latest.predictionId
    });
  } 
  catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// =====================================================================
// 4️⃣ Mark Prediction as Used (ESP calls after pump finishes)
// =====================================================================
app.post("/api/prediction/mark-used/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const latest = await Prediction.findOne({
      deviceId,
      used: false
    }).sort({ createdAt: -1 });

    if (!latest)
      return res.json({ success: false, message: "No active prediction" });

    latest.used = true;
    await latest.save();

    res.json({ success: true });
  }
  catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// =====================================================================
app.listen(5000, () => console.log("API running at http://localhost:5000"));
