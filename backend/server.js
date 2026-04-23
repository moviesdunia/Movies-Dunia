const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("YOUR_MONGODB_URL");

const Movie = require('./models/Movie');

app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

app.post('/webhook', async (req, res) => {
  const msg = req.body.channel_post;

  if (msg && msg.text) {
    await Movie.create({
      title: msg.text,
      language: "Auto",
      poster: "https://via.placeholder.com/300x400",
      telegramLink: `https://t.me/YOUR_CHANNEL/${msg.message_id}`
    });
  }

  res.sendStatus(200);
});

app.listen(5000, () => console.log("Server running"));
