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

// Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: "movies_dunia",
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    public_id: file.originalname.split('.')[0] + "_" + Date.now(),
  }),
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Send TMDB Key to Frontend securely
app.get("/api/config/tmdb", (req, res) => {
  res.json({ apiKey: process.env.TMDB_API_KEY });
});

// 2. Fetch all movies
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Secure Upload
app.post("/api/movies/upload", upload.fields([{ name: 'video' }, { name: 'poster' }]), async (req, res) => {
  try {
    if (req.body.password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized: Invalid Password" });
    }
    const newMovie = new Movie({
      title: req.body.title,
      category: req.body.category,
      overview: req.body.overview,
      videoUrl: req.files['video'][0].path,
      poster: req.files['poster'] ? req.files['poster'][0].path : ""
    });
    await newMovie.save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Secure Delete
app.delete("/api/movies/:id", async (req, res) => {
  if (req.body.password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid Password" });
  }
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port
${PORT}`));
