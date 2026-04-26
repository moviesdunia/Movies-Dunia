require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Movie = require('./models/movie');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// ✅ MongoDB Connection (Option 1 - ENV)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Mongo Error:', err));

// =======================
// 🎬 API ROUTES
// =======================

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new movie
app.post('/api/movies', async (req, res) => {
  try {
    const { title, videoUrl, poster, category, language } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ error: "Title and Video URL required" });
    }

    const movie = new Movie({
      title,
      videoUrl,
      poster,
      category,
      language
    });

    await movie.save();

    res.json({ message: "Movie Uploaded Successfully", movie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete all movies (Admin use)
app.delete('/api/movies', async (req, res) => {
  try {
    await Movie.deleteMany({});
    res.json({ message: "All movies deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// 🌐 ROUTES
// =======================

// Admin page
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Default route (Homepage)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// =======================
// 🚀 SERVER START
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
