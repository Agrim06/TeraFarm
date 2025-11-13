// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --------------------
// Config
// --------------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/esp_input";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected:", MONGO_URI))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    // don't exit here if you want the server to still run without DB
    // process.exit(1);
  });
const PORT = process.env.PORT || 5000;

// --------------------
// MongoDB connection
// --------------------
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected:", MONGO_URI))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// --------------------
// Helpers
// --------------------
/**
 * Safely create or reuse a Mongoose model bound to a specific collection name.
 * - collectionName: string provided by caller (will be sanitized)
 * Returns a Mongoose model that writes to the given collection.
 */
function getDynamicModel(collectionName) {
  if (!collectionName) throw new Error("Collection name required");

  // sanitize: allow letters, numbers and underscores only
  const safeName = String(collectionName).replace(/[^a-zA-Z0-9_]/g, "");
  if (!safeName) throw new Error("Invalid collection name after sanitization");

  // If a model with this name already exists, reuse it
  if (mongoose.models[safeName]) {
    return mongoose.models[safeName];
  }

  // Define a flexible schema (strict:false so extra fields from device won't fail)
  const schema = new mongoose.Schema(
    {
      deviceId: String,
      temperature: Number,
      humidity: Number,
      moisture: Number,
      timestamp: { type: Date, default: Date.now },
    },
    { strict: false }
  );

  // Compile and return the model (third arg forces collection name)
  return mongoose.model(safeName, schema, safeName);
}

// --------------------
// Routes
// --------------------

// Health
app.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState; // 0 disconnected, 1 connected
  res.json({
    status: mongoState === 1 ? "ok" : "degraded",
    mongoState,
    db: mongoose.connection.name || null,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /data
 * Body: { deviceId, moisture, temperature, humidity, timestamp, collection }
 * Saves document into irrigation.<collection>
 */
app.post("/data", async (req, res) => {
  try {
    const { deviceId, temperature, humidity, moisture, timestamp, collection } = req.body;

    if (!collection) {
      return res.status(400).json({ success: false, message: "Missing 'collection' in request body" });
    }

    // get-or-create model safely
    const DynamicModel = getDynamicModel(collection);

    const doc = new DynamicModel({
      deviceId,
      temperature,
      humidity,
      moisture,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await doc.save();

    return res.status(201).json({ success: true, saved_in: collection, data: doc });
  } catch (err) {
    console.error("POST /data error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /latest?collection=<name>
 * Returns latest document (by timestamp) from the given collection.
 */
app.get("/latest", async (req, res) => {
  try {
    const collection = req.query.collection;
    if (!collection) return res.status(400).json({ success: false, message: "Missing ?collection=" });

    const DynamicModel = getDynamicModel(collection);
    const latest = await DynamicModel.findOne().sort({ timestamp: -1 }).lean().exec();

    return res.json({ success: true, collection, data: latest || null });
  } catch (err) {
    console.error("GET /latest error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /collections
 * Lists all collections present in the irrigation DB.
 */
app.get("/collections", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    const collectionNames = cols.map((c) => c.name);
    return res.json({ success: true, collections: collectionNames });
  } catch (err) {
    console.error("GET /collections error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Optional: quick endpoint to drop a collection (useful for dev only)
// app.delete("/collections/:name", async (req, res) => {
//   try {
//     const name = req.params.name.replace(/[^a-zA-Z0-9_]/g, "");
//     if (!name) return res.status(400).json({ success: false, message: "Invalid name" });
//     await mongoose.connection.db.dropCollection(name);
//     return res.json({ success: true, message: `Dropped collection ${name}` });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
