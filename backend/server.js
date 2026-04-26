const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Movie Model
const Movie = require("./models/Movie");

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer (file upload)
const upload = multer({ dest: "uploads/" });


// ==========================
// 🎬 ADD MOVIE
// ==========================
app.post("/api/add-movie", upload.single("video"), async (req, res) => {
  try {
    let videoUrl = "";

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video"
      });
      videoUrl = uploadRes.secure_url;
    }

    const movie = new Movie({
      title: req.body.title,
      poster: req.body.poster,
      category: req.body.category,
      language: req.body.language,
      videoUrl: videoUrl
    });

    await movie.save();

    res.json({ message: "Movie uploaded successfully" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// ==========================
// 📥 GET ALL MOVIES
// ==========================
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});


// ==========================
// 🗑 DELETE ONE MOVIE
// ==========================
app.delete("/api/delete/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// ==========================
// 🗑 DELETE ALL MOVIES
// ==========================
app.delete("/api/delete-all", async (req, res) => {
  try {
    await Movie.deleteMany({});
    res.json({ message: "All movies deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// ==========================
// 🌐 FRONTEND
// ==========================
app.use(express.static(path.join(__dirname, "..")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});


// ==========================
app.listen(5000, () => console.log("Server running on port 5000"));
