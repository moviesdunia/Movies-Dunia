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

// 2. Upload/Add a New Movie
app.post('/api/movies', async (req, res) => {
    try {
        const { title, poster, videoUrl, category, adminPassword } = req.body;
        if (adminPassword !== "dunia2026") {
            return res.status(401).json({ error: "Incorrect Admin Password" });
        }
        const newMovie = new Movie({ title, poster, videoUrl, category });
        await newMovie.save();
        res.json({ message: "Movie added successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete a Movie
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const { adminPassword } = req.body;
        if (adminPassword !== "dunia2026") {
            return res.status(401).json({ error: "Incorrect Admin Password" });
        }
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Config Route for API Keys
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

// FINAL STARTUP - Keep these lines exactly as they are
const PORT = process.env.PORT || 10000;
app.listen(PORT, function() {
    console.log("Server online on port " + PORT);
});
