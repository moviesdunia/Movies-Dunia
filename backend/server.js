const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ Movie Schema
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  category: String,
  rating: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Home Route
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// ✅ Get Movies API
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// ✅ Telegram Webhook
app.post('/webhook', async (req, res) => {
  try {
    console.log("Incoming:", JSON.stringify(req.body));

    const message = req.body.channel_post || req.body.message;

    if (message && message.text) {
      const text = message.text;

      let poster = "";
      let rating = "N/A";

      // 🎬 Fetch movie data from OMDB
      try {
        const response = await axios.get(
          `https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=eee94f23`
        );

        if (response.data && response.data.Response === "True") {
          poster = response.data.Poster !== "N/A" ? response.data.Poster : "";
          rating = response.data.imdbRating !== "N/A" ? response.data.imdbRating : "N/A";
        }
      } catch (err) {
        console.log("OMDB Error:", err.message);
      }

      // 🎯 Category detection
      let category = "Other";
      const lower = text.toLowerCase();

      if (lower.includes("hindi")) category = "Hindi";
      else if (lower.includes("tamil")) category = "Tamil";
      else if (lower.includes("bengali")) category = "Bengali";

      // ✅ CREATE TELEGRAM POST LINK (IMPORTANT FIX)
      const username = message.chat.username;
      const messageId = message.message_id;

      const postLink = username
        ? `https://t.me/${username}/${messageId}`
        : "https://t.me/moviesurequired";

      // 💾 Save to DB
      await Movie.create({
        title: text,
        link: postLink,
        poster,
        category,
        rating
      });

      console.log("Saved:", text);
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("Webhook Error:", err);
    res.sendStatus(500);
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
