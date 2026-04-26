const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ENV
const MONGO_URL = process.env.MONGO_URL;
const TMDB_KEY = process.env.TMDB_KEY;

// CONNECT DB
mongoose.connect(MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// MODEL
const MovieSchema = new mongoose.Schema({
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String,
  rating: String
}, { timestamps: true });

const Movie = mongoose.model("Movie", MovieSchema);

// GET ALL MOVIES
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ADD MOVIE (AUTO POSTER FROM TMDB)
app.post("/api/movies", async (req, res) => {
  try {
    const { title, link, category } = req.body;

    let poster = "";
    let trailer = "";

    if (TMDB_KEY) {
      const tmdb = await axios.get(
        "https://api.themoviedb.org/3/search/movie",
        {
          params: {
            api_key: TMDB_KEY,
            query: title
          }
        }
      );

      if (tmdb.data.results.length > 0) {
        const movie = tmdb.data.results[0];

        poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;

        // Trailer
        const videos = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
          {
            params: { api_key: TMDB_KEY }
          }
        );

        const trailerData = videos.data.results.find(
          v => v.type === "Trailer"
        );

        if (trailerData) {
          trailer = `https://www.youtube.com/embed/${trailerData.key}`;
        }
      }
    }

    const newMovie = new Movie({
      title,
      link,
      poster,
      trailer,
      category,
      rating: "N/A"
    });

    await newMovie.save();
    res.json(newMovie);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL MOVIES
app.delete("/api/movies", async (req, res) => {
  await Movie.deleteMany({});
  res.json({ message: "All movies deleted" });
});

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
