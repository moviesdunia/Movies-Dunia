const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 ADMIN LOGIN (ENV or default)
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "12345";

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Schema
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String,
  rating: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ HOME
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// ✅ GET MOVIES
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// 🗑 DELETE ALL
app.get('/api/delete-all', async (req, res) => {
  await Movie.deleteMany({});
  res.send("All movies deleted");
});

// 🔐 LOGIN
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ➕ ADD MOVIE (ADMIN)
app.post('/api/add-movie', async (req, res) => {
  const { title, link, poster, trailer, rating } = req.body;

  await Movie.create({
    title,
    link,
    poster,
    trailer,
    rating,
    category: "Manual"
  });

  res.json({ success: true });
});

// 🗑 DELETE ONE
app.delete('/api/delete/:id', async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// 🎬 TELEGRAM WEBHOOK (AUTO ADD)
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post || req.body.message;

    if (message && message.text) {

      let title = message.text
        .replace(/full movie/gi, "")
        .replace(/download/gi, "")
        .trim();

      let poster = "";
      let rating = "N/A";
      let trailer = "";

      // 🎥 TMDB
      try {
        const tmdb = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(title)}`
        );

        if (tmdb.data.results.length > 0) {
          const m = tmdb.data.results[0];

          poster = m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : "";

          rating = m.vote_average;
        }
      } catch (e) {
        console.log("TMDB error");
      }

      // ▶️ YOUTUBE TRAILER
      try {
        const yt = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(title + " official trailer")}&key=${process.env.YOUTUBE_KEY}&type=video&maxResults=1`
        );

        if (yt.data.items.length > 0) {
          const videoId = yt.data.items[0].id.videoId;
          trailer = `https://www.youtube.com/embed/${videoId}`;
        }
      } catch (e) {
        console.log("YT error");
      }

      await Movie.create({
        title,
        link: "https://t.me/moviesurequired",
        poster,
        trailer,
        rating,
        category: "Auto"
      });

      console.log("Saved:", title);
    }

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// 🚀 START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
