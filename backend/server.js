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
  category: String,
  rating: String,
  createdAt: { type: Date, default: Date.now }
});

// Home
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// Get Movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ✅ NEW: Add Movie API (ADMIN)
app.post('/api/add-movie', async (req, res) => {
  try {
    const { title, link, poster, category, rating } = req.body;

    const movie = await Movie.create({
      title,
      link,
      poster,
      category,
      rating
    });

    res.json({ success: true, movie });
  } catch (err) {
    res.json({ success: false });
  }
});

// Telegram webhook (same as before)
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post || req.body.message;

    if (message && message.text) {
      const text = message.text;

      let poster = "";
      let rating = "N/A";

      try {
        const response = await axios.get(
          `https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=eee94f23`
        );

        if (response.data && response.data.Response === "True") {
          poster = response.data.Poster;
          rating = response.data.imdbRating;
        }
      } catch {}

      await Movie.create({
        title: text,
        link: "https://t.me/moviesurequired",
        poster,
        category: "Other",
        rating
      });
    }

    res.sendStatus(200);
  } catch {
    res.sendStatus(500);
  }
});

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
