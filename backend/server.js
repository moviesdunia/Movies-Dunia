const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Movie Schema
const movieSchema = new mongoose.Schema({
    title: String,
    videoUrl: String,
    poster: String,
    category: String,
    createdAt: { type: Date, default: Date.now }
});
const Movie = mongoose.model('Movie', movieSchema);

// --- API ROUTES ---

// 1. Get All Library Movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Upload a New Movie
app.post('/api/movies', async (req, res) => {
    try {
        const newMovie = new Movie(req.body);
        await newMovie.save();
        res.json({ message: "Movie added to library!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Config Route for Keys
app.get('/api/config/tmdb', (req, res) => {
    res.json({ 
        apiKey: process.env.TMDB_API_KEY,
        youtubeKey: process.env.YOUTUBE_API_KEY 
    });
});

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fixed the Syntax Error here:
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PO
                                            RT}`);
});
