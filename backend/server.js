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

// ✅ Get Movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ✅ Add Movie (Admin Panel)
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
    console.log(err);
    res.json({ success: false });
  }
});

// ❌ DELETE ALL MOVIES (NEW FEATURE)
app.delete('/api/delete-all', async (req, res) => {
  try {
    await Movie.deleteMany({});
    res.json({ success: true, message: "All movies deleted successfully ✅" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Error deleting movies ❌" });
  }
});

// ✅ Telegram Webhook
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post || req.body.message;

    if (message && message.text && message.text.length > 3) {
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
      } catch (err) {
        console.log("OMDB Error:", err.message);
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

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
