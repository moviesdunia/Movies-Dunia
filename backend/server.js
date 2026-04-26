const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // VERY IMPORTANT

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Schema
const MovieSchema = new mongoose.Schema({
  title: String,
  link: String,
  poster: String,
  trailer: String,
  category: String
});

const Movie = mongoose.model("Movie", MovieSchema);

// 🎬 GET MOVIES
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ _id: -1 });
  res.json(movies);
});

// 🎬 ADD MOVIE (AUTO POSTER + TRAILER)
app.post("/api/movies", async (req, res) => {
  try {
    const { title, link, category } = req.body;

    let poster = "";
    let trailer = "";

    // TMDB SEARCH
    const search = await axios.get(
      "https://api.themoviedb.org/3/search/movie",
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query: title
        }
      }
    );

    if (search.data.results.length > 0) {
      const movie = search.data.results[0];
      poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path;

      // GET TRAILER
      const video = await axios.get(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY
          }
        }
      );

      const trailerData = video.data.results.find(
        v => v.type === "Trailer" && v.site === "YouTube"
      );

      if (trailerData) {
        trailer = `https://www.youtube.com/embed/${trailerData.key}`;
      }
    }

    const newMovie = new Movie({
      title,
      link,
      category,
      poster,
      trailer
    });

    await newMovie.save();
    res.json({ message: "Movie Uploaded Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Upload Failed" });
  }
});

// ❌ DELETE ALL
app.delete("/api/movies", async (req, res) => {
  await Movie.deleteMany();
  res.json({ message: "All movies deleted" });
});

// SERVER
app.listen(process.env.PORT, () => {
  console.log("Server running...");
});
