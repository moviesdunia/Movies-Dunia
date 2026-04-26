const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ================= MODEL =================
const Movie = mongoose.model("Movie", {
  title: String,
  videoUrl: String,
  poster: String,
  category: String,
  language: String,
  createdAt: { type: Date, default: Date.now }
});

// ================= CLOUDINARY =================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ================= MULTER =================
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

// ================= ADD MOVIE =================
app.post("/api/add-movie", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video"
    });

    // 🔥 SAFE DEFAULT POSTER (NO TMDB = NO ERROR)
    const posterUrl = "https://via.placeholder.com/300x450";

    // Save movie in DB
    const movie = new Movie({
      title: req.body.title,
      videoUrl: result.secure_url,
      poster: posterUrl,
      category: req.body.category,
      language: req.body.language
    });

    await movie.save();

    res.send("✅ Uploaded Successfully");

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).send(err.message);
  }
});

// ================= GET MOVIES =================
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ================= DELETE ONE =================
app.delete("/api/delete/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

// ================= DELETE ALL =================
app.delete("/api/delete-all", async (req, res) => {
  await Movie.deleteMany({});
  res.send("All Deleted");
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
