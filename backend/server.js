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
const MovieSchema = new mongoose.Schema({
  title: String,
  category: String,
  poster: String,
  videoUrl: String
});

const Movie = mongoose.model("Movie", MovieSchema);

/* ================= CLOUDINARY ================= */
cloudinary.config({
  cloud_name: process.env.dsfklevtl,
  api_key: process.env.149553424498557,
  api_secret: process.env.nq1hE2YKmCr4h4xDYNWCs1PSwVc
});

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= UPLOAD API ================= */
app.post("/upload", upload.fields([
  { name: "video" },
  { name: "poster" }
]), async (req, res) => {
  try {
    const { title, category } = req.body;

    // Upload poster
    const posterUpload = await cloudinary.uploader.upload_stream({
      resource_type: "image"
    });

    const videoUpload = await cloudinary.uploader.upload_stream({
      resource_type: "video"
    });

    // convert buffer to stream
    const uploadPoster = new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (err, result) => resolve(result)
      );
      streamifier.createReadStream(req.files.poster[0].buffer).pipe(stream);
    });

    const uploadVideo = new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (err, result) => resolve(result)
      );
      streamifier.createReadStream(req.files.video[0].buffer).pipe(stream);
    });

    const posterResult = await uploadPoster;
    const videoResult = await uploadVideo;

    const movie = new Movie({
      title,
      category,
      poster: posterResult.secure_url,
      videoUrl: videoResult.secure_url
    });

    await movie.save();

    res.json({ success: true, movie });

  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= GET MOVIES ================= */
app.get("/movies", async (req, res) => {
  const movies = await Movie.find();
  res.json(movies);
});

/* ================= START ================= */
app.listen(5000, () => console.log("Server running on 5000"));
