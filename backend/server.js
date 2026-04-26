const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* ============================
   🔐 ENV VARIABLES REQUIRED
============================ */
const MONGO_URI = process.env.MONGO_URI;
const TMDB_KEY = process.env.TMDB_KEY;
const YT_KEY = process.env.YT_KEY;
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "Shiuli#420";

/* ============================
   🗄️ DATABASE
============================ */
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

/* ============================
   🎬 MOVIE MODEL
============================ */
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String,
  rating: String,
  trending: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

/* ============================
   🔐 ADMIN LOGIN
============================ */
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

/* ============================
   🎥 GET MOVIES
============================ */
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

/* ============================
   🔥 TRENDING MOVIES
============================ */
app.get("/api/trending", async (req, res) => {
  const movies = await Movie.find({ trending: true }).limit(10);
  res.json(movies);
});

/* ============================
   🎬 ADD MOVIE (ADMIN)
============================ */
app.post("/api/add", async (req, res) => {
  try {
    const { title, link, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title required" });
    }

    /* 🎯 FETCH FROM TMDB */
    let poster = "";
    let rating = "N/A";

    try {
      const tmdb = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}`
      );

      if (tmdb.data.results.length > 0) {
        const movie = tmdb.data.results[0];
        poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;
        rating = movie.vote_average;
      }
    } catch (err) {
      console.log("TMDB error");
    }

    /* 🎬 YOUTUBE TRAILER */
    let trailer = "";

    try {
      const yt = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(title + " trailer")}&key=${YT_KEY}&maxResults=1`
      );

      if (yt.data.items.length > 0) {
        trailer = "https://www.youtube.com/embed/" + yt.data.items[0].id.videoId;
      }
    } catch (err) {
      console.log("YouTube error");
    }

    const newMovie = await Movie.create({
      title,
      link,
      poster,
      trailer,
      category,
      rating
    });

    res.json(newMovie);

  } catch (err) {
    res.status(500).json({ error: "Failed to add movie" });
  }
});

/* ============================
   🗑️ DELETE MOVIE
============================ */
app.delete("/api/delete/:id", async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ============================
   ✏️ UPDATE MOVIE
============================ */
app.put("/api/update/:id", async (req, res) => {
  try {
    const updated = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

/* ============================
   ⭐ MARK TRENDING
============================ */
app.put("/api/trending/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    movie.trending = !movie.trending;
    await movie.save();
    res.json(movie);
  } catch {
    res.status(500).json({ error: "Trending update failed" });
  }
});

/* ============================
   🧹 CLEAR ALL DATA (ADMIN)
============================ */
app.delete("/api/clear", async (req, res) => {
  try {
    await Movie.deleteMany({});
    res.json({ success: true, message: "All movies deleted" });
  } catch {
    res.status(500).json({ error: "Clear failed" });
  }
});

/* ============================
   🏠 HOME
============================ */
app.get("/", (req, res) => {
  res.send("🚀 Movies Dunia PRO Backend Running");
});

/* ============================
   🚀 START SERVER
============================ */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🔥 Server running on " + PORT));
