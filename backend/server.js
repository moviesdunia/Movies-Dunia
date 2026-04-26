require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= MODEL ================= */
const Movie = mongoose.model("Movie", {
  title: String,
  category: String,
  poster: String,
  videoUrl: String,
  createdAt: { type: Date, default: Date.now }
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= UPLOAD MOVIE ================= */
app.post("/admin/upload", upload.fields([
  { name: "poster" },
  { name: "video" }
]), async (req, res) => {
  try {
    const { title, category } = req.body;

    // Upload poster
    const posterUpload = new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (err, result) => resolve(result)
      );
      streamifier.createReadStream(req.files.poster[0].buffer).pipe(stream);
    });

    // Upload video
    const videoUpload = new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (err, result) => resolve(result)
      );
      streamifier.createReadStream(req.files.video[0].buffer).pipe(stream);
    });

    const poster = await posterUpload;
    const video = await videoUpload;

    const movie = new Movie({
      title,
      category,
      poster: poster.secure_url,
      videoUrl: video.secure_url
    });

    await movie.save();

    res.json({ success: true, movie });

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= GET MOVIES ================= */
app.get("/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

/* ================= DELETE ================= */
app.delete("/admin/movie/:id", async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on " + PORT));
