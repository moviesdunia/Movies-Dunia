const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
  createdAt: { type: Date, default: Date.now }
});

// ✅ Home Route
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// ✅ Get Movies API
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ✅ Telegram Webhook (IMPORTANT)
app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post; // for channel posts

    if (message && message.text) {
      const text = message.text;

      await Movie.create({
        title: text,
        link: "https://t.me/MoviesUNeed" // 🔁 your channel link
      });

      console.log("Saved:", text);
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("Webhook Error:", err);
    res.sendStatus(500);
  }
});

// ✅ Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
