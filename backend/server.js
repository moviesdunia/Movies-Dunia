const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// 🔗 MongoDB
// =======================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// =======================
// 🎬 Model
// =======================
const Movie = require("./models/Movie");

// =======================
// ☁️ Cloudinary
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// 📦 Upload
// =======================
const upload = multer({ dest: "uploads/" });

// =======================
// ➕ ADD MOVIE (AUTO POSTER)
// =======================
app.post("/api/add-movie", upload.single("video"), async (req, res) => {
  try {
    let videoUrl = "";

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video"
      });
      videoUrl = uploadRes.secure_url;
    }

    // 🎬 Fetch poster from TMDB
    let posterUrl = "";

    const tmdb = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: req.body.title
        }
      }
    );

    if (tmdb.data.results.length > 0) {
      posterUrl =
        "https://image.tmdb.org/t/p/w500" +
        tmdb.data.results[0].poster_path;
    } else {
      posterUrl =
        "https://via.placeholder.com/300x450?text=No+Poster";
    }

    const movie = new Movie({
      title: req.body.title,
      poster: posterUrl,
      category: req.body.category,
      language: req.body.language,
      videoUrl: videoUrl
    });

    await movie.save();

    res.json({ message: "Movie uploaded successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// =======================
// 📥 GET MOVIES
// =======================
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// =======================
// 🗑 DELETE ONE
// =======================
app.delete("/api/delete/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// =======================
// 🗑 DELETE ALL
// =======================
app.delete("/api/delete-all", async (req, res) => {
  await Movie.deleteMany({});
  res.json({ message: "All deleted" });
});

// =======================
// 🌐 FRONTEND
// =======================
app.use(express.static(path.join(__dirname, "..")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// =======================
app.listen(5000, () => console.log("Server running on port 5000"));
