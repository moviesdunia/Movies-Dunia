require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

// ===== Model =====
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String,
});

// ===== Cloudinary =====
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== Upload =====
const upload = multer({ dest: "uploads/" });

// ===== TMDB helper =====
async function getMovieData(title) {
  try {
    const res = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_KEY}&query=${title}`
    );

    const movie = res.data.results[0];

    if (!movie) return {};

    return {
      poster: "https://image.tmdb.org/t/p/w500" + movie.poster_path,
      trailer: `https://www.youtube.com/embed?search_query=${title} trailer`
    };

  } catch {
    return {};
  }
}

// ===== Upload API =====
app.post("/api/upload", upload.single("video"), async (req, res) => {
  try {
    const { title, category } = req.body;

    let videoUrl = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video",
      });
      videoUrl = result.secure_url;
    }

    const extra = await getMovieData(title);

    const movie = new Movie({
      title,
      category,
      link: videoUrl,
      poster: extra.poster || "",
      trailer: extra.trailer || ""
    });

    await movie.save();

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

// ===== Get movies =====
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ _id: -1 });
  res.json(movies);
});

// ===== Delete all =====
app.delete("/api/delete-all", async (req, res) => {
  await Movie.deleteMany({});
  res.json({ success: true });
});

// ===== Pages =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

app.get("/watch", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/player.html"));
});

// ===== Start =====
app.listen(5000, () => console.log("Server running"));
