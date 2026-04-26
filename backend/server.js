const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String,
  rating: String,
  createdAt: { type: Date, default: Date.now }
});

// Get movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// Delete all
app.get('/api/delete-all', async (req, res) => {
  await Movie.deleteMany({});
  res.send("All movies deleted");
});

// 🔥 TELEGRAM WEBHOOK (FINAL FIXED)
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post || req.body.message;

    if (message && message.text) {

      let original = message.text;

      let title = original
        .replace(/full movie/gi, "")
        .replace(/download/gi, "")
        .replace(/\./g, " ")
        .trim();

      if (!title || title.length < 2) {
        title = original;
      }

      console.log("Title:", title);

      let poster = "";
      let rating = "N/A";
      let trailer = "";

      // 🎬 TMDB
      try {
        const tmdb = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_KEY}&query=${encodeURIComponent(title)}`
        );

        if (tmdb.data.results.length > 0) {
          const movie = tmdb.data.results[0];

          poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : "";

          rating = movie.vote_average;
        }
      } catch (err) {
        console.log("TMDB error:", err.message);
      }

      // ▶️ YOUTUBE (FINAL WORKING)
      try {
        const yt = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(title + " official trailer")}&key=${process.env.YOUTUBE_KEY}&type=video&maxResults=1`
        );

        if (yt.data.items && yt.data.items.length > 0) {
          const videoId = yt.data.items[0].id.videoId;

          if (videoId) {
            trailer = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      } catch (err) {
        console.log("YouTube error:", err.message);
      }

      await Movie.create({
        title,
        link: "https://t.me/moviesurequired",
        poster,
        trailer,
        category: "Other",
        rating
      });

      console.log("Saved:", title);
    }

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
