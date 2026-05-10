const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path"); 
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Movie = require("./models/Movie");

dotenv.config();
const app = express();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());

// --- CRITICAL: LINKING THE PUBLIC FOLDER ---
// Since server.js is in /backend, we go up one level (..) to find /public
app.use(express.static(path.join(__dirname, "../public")));

// Database Connection
mongoose.connect(process.env.MONGO_URI || "")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "movies_dunia",
      resource_type: file.mimetype.startsWith("video") ? "video" : "image",
      public_id: file.originalname.split('.')[0] + "_" + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });

// --- API ROUTES ---

// Get All Movies
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Movie Route
app.post("/api/movies/upload", upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, category, language, overview } = req.body;
    const videoUrl = req.files['video'] ? req.files['video'][0].path : null;
    const posterUrl = req.files['poster'] ? req.files['poster'][0].path : null;

    if (!videoUrl) return res.status(400).json({ error: "Video file is required" });

    const newMovie = new Movie({
      title,
      category: category || "action",
      language: language || "English",
      overview,
      videoUrl,
      poster: posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"
    });

    await newMovie.save();
    res.status(201).json({ message: "Success!", movie: newMovie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVE THE PAGES ---
// If the user asks for /admin.html, Express will now find it in /public.
// This fallback ensures index.html loads for the main URL.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on p
ort ${PORT}`));
