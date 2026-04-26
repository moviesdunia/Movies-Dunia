const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const Movie = require('./models/movie');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.connect('YOUR_MONGODB_URI')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// API ROUTES

// Get all movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// Add movie
app.post('/api/movies', async (req, res) => {
  const movie = new Movie(req.body);
  await movie.save();
  res.json(movie);
});

// Fallback (IMPORTANT)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running'));
