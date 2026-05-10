const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Movie = require("./models/Movie");

// Load Environment Variables
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

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- MULTI-PART FILE UPLOAD CONFIG (Cloudinary) ---

// Setup storage for Videos and Posters
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

// 1. Get All Movies (Used by your index.html)
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// 2. Upload Movie with Poster (Used for adding new content)
// Expects fields: title, category, language, overview and files: video, poster
app.post("/api/movies/upload", upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, category, language, overview } = req.body;
    
    const videoUrl = req.files['video'] ? req.files['video'][0].path : null;
    const posterUrl = req.files['poster'] ? req.files['poster'][0].path : null;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video file is required" });
    }

    const newMovie = new Movie({
      title,
      category,
      language,
      overview,
      videoUrl,
      poster: posterUrl
    });

    const savedMovie = await newMovie.save();
    res.status(201).json(savedMovie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed: " + err.message });
  }
});

// 3. Delete a Movie
app.delete("/api/movies/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on por
  t ${PORT}`);
});
