const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const Movie = require("./models/movie");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ADMIN
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

// GET MOVIES
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ADD MOVIE
app.post("/api/movies", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.json({ message: "Movie Added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ALL
app.delete("/api/movies", async (req, res) => {
  await Movie.deleteMany({});
  res.json({ message: "Deleted All Movies" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
