const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const Movie = require("./models/Movie");

const app = express();
app.use(cors());
app.use(express.json());

// ENV
mongoose.connect(process.env.MONGO_URI);

// CLOUDINARY
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// FILE UPLOAD
const upload = multer({ dest: "uploads/" });

// 👉 ADD MOVIE (ADMIN)
app.post("/api/add-movie", upload.single("video"), async (req, res) => {
  try {
    const videoUpload = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video"
    });

    const movie = new Movie({
      title: req.body.title,
      poster: req.body.poster,
      category: req.body.category,
      language: req.body.language,
      videoUrl: videoUpload.secure_url
    });

    await movie.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// 👉 GET MOVIES
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// 👉 SERVE FRONTEND
app.use(express.static(path.join(__dirname, "..")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(5000, () => console.log("Server running"));
