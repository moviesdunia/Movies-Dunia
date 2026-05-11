const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'movies_dunia', allowed_formats: ['jpg', 'png', 'jpeg'] }
});
const upload = multer({ storage: storage });

// 2. MongoDB Schema
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ DB Connected'));
const Movie = mongoose.model('Movie', new mongoose.Schema({
    title: String, videoUrl: String, poster: String, category: String, createdAt: { type: Date, default: Date.now }
}));

// 3. API Routes
app.get('/api/movies', async (req, res) => {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
});

app.post('/api/movies', upload.single('poster'), async (req, res) => {
    try {
        const { title, videoUrl, category, adminPassword } = req.body;
        if (adminPassword !== "dunia2026") return res.status(401).json({ error: "Invalid Pass" });
        const posterUrl = req.file ? req.file.path : "";
        const newMovie = new Movie({ title, poster: posterUrl, videoUrl, category });
        await newMovie.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/movies/:id', async (req, res) => {
    try {
        if (req.body.adminPassword !== "dunia2026") return res.status(401).json({ error: "Invalid Pass" });
        await Movie.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/config/tmdb', (req, res) => {
    res.json({ apiKey: process.env.TMDB_API_KEY, youtubeKey: process.env.YOUTUBE_API_KEY });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("🚀 Server running on port " 
                                   + PORT));
