const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose.connect("mongodb+srv://admin:Movies%40123@cluster0.2g9c2ox.mongodb.net/moviesdunia")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Movie Model
const Movie = mongoose.model("Movie", {
  title: String,
  link: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Home
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// ✅ Get Movies
app.get('/api/movies', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ✅ Add Movie (for testing)
app.get('/add', async (req, res) => {
  await Movie.create({
    title: "Test Movie",
    link: "https://t.me/test"
  });
  res.send("Movie Added");
});

// ✅ Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on " + PORT));
