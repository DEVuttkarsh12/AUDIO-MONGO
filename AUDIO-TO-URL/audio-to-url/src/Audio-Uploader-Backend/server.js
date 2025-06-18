require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// MongoDB
mongoose.connect("mongodb://localhost:27017/audio-DB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const audioSchema = new mongoose.Schema({
  audioUrl: String,
  uploadedAt: { type: Date, default: Date.now },
});
const Audio = mongoose.model("Audio", audioSchema, "audios");

// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Upload route
app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video", // For audio files too
    });

    const newAudio = new Audio({ audioUrl: result.secure_url });
    await newAudio.save();
    fs.unlinkSync(req.file.path); // remove file after upload

    res.status(200).json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error("Upload Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);
