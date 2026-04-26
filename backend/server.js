require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== CLOUDINARY CONFIG =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ===== MONGODB CONNECT =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

// ===== MULTER (FILE UPLOAD) =====
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===== SCHEMA =====
const movieSchema = new mongoose.Schema({
  title: String,
  language: String,
  videoUrl: String,
  poster: String,
  createdAt: { type: Date, default: Date.now }
});

const Movie = mongoose.model("Movie", movieSchema);

// ===== ROUTES =====

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Movies Dunia API Running 🚀");
});

// GET ALL MOVIES
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD MOVIE
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    const { title, language } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const newMovie = new Movie({
      title,
      language,
      videoUrl: result.secure_url,
      poster: "https://via.placeholder.com/300x450"
    });

    await newMovie.save();

    res.json({ message: "Uploaded successfully", movie: newMovie });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
