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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

mongoose.connect(process.env.MONGO_URI || "")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

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

// --- ROUTES ---

app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload with Password Check
app.post("/api/movies/upload", upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, category, language, overview, password } = req.body;
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized: Invalid Password" });
    }

    const videoUrl = req.files['video'] ? req.files['video'][0].path : null;
    const posterUrl = req.files['poster'] ? req.files['poster'][0].path : null;

    const newMovie = new Movie({
      title, category, language, overview, videoUrl,
      poster: posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"
    });

    await newMovie.save();
    res.status(201).json({ message: "Success!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ROUTE
app.delete("/api/movies/:id", async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid Password" });
  }
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Movie Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on po
rt ${PORT}`));
