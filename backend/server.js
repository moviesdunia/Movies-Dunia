const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Schema
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  poster: String,
  category: String,
  rating: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Routes
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// GET movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ADD movie manually (admin panel)
app.post('/api/add-movie', async (req, res) => {
  try {
    const { title, link, poster, category, rating } = req.body;

    await Movie.create({ title, link, poster, category, rating });

    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// DELETE all movies
app.delete('/api/delete-all', async (req, res) => {
  await Movie.deleteMany({});
  res.json({ message: "All movies deleted ✅" });
});

// ✅ TELEGRAM WEBHOOK (IMPROVED)
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post || req.body.message;

    if (message && message.text) {

      let text = message.text;

      // 🔥 CLEAN TITLE
      text = text
        .replace(/full movie/gi, "")
        .replace(/download/gi, "")
        .replace(/hindi/gi, "")
        .replace(/tamil/gi, "")
        .replace(/hd/gi, "")
        .replace(/\./g, " ")
        .trim();

      let poster = "";
      let rating = "N/A";

      try {
        const response = await axios.get(
          `https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=eee94f23`
        );

        if (response.data && response.data.Response === "True") {
          poster = response.data.Poster !== "N/A" ? response.data.Poster : "";
          rating = response.data.imdbRating;
        }
      } catch (err) {
        console.log("OMDB error:", err.message);
      }

      let category = "Other";
      const lower = text.toLowerCase();

      if (lower.includes("hindi")) category = "Hindi";
      else if (lower.includes("tamil")) category = "Tamil";
      else if (lower.includes("bengali")) category = "Bengali";

      await Movie.create({
        title: text,
        link: "https://t.me/moviesurequired",
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

// START
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
