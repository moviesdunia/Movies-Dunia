const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Movie = require("./models/Movie");

const app = express();
app.use(express.json());

// ==========================
// 🔗 DATABASE
// ==========================
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ==========================
// ☁️ CLOUDINARY
// ==========================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    resource_type: "video",
    folder: "movies"
  }
});

const upload = multer({ storage });

// ==========================
// 📁 FRONTEND
// ==========================
app.use(express.static(path.join(__dirname, "../public")));

// ==========================
// 🎬 TMDB AUTO DATA
// ==========================
async function getMovieDetails(title) {
  try {
    const res = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          api_key: process.env.TMDB_KEY,
          query: title
        }
      }
    );

    const movie = res.data.results[0];

    if (!movie) return {};

    return {
      poster: movie.poster_path
        ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
        : "",
      overview: movie.overview,
      language: movie.original_language
    };

  } catch {
    return {};
  }
}

// ==========================
// 🎬 API
// ==========================

// GET movies
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// UPLOAD VIDEO + AUTO TMDB
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    const details = await getMovieDetails(req.body.title);

    const movie = new Movie({
      title: req.body.title,
      category: req.body.category || "Trending",
      videoUrl: req.file.path,
      poster: details.poster || req.body.poster,
      overview: details.overview,
      language: details.language
    });

    await movie.save();

    res.json({ message: "Uploaded", movie });

  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
app.delete("/api/movies/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ==========================
// 🌐 ROUTES
// ==========================
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.get("/player", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/player.html"));
});

// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
