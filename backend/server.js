require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Schema
const Movie = mongoose.model("Movie", {
  title: String,
  video: String,   // 🔥 streaming link
  poster: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ Get movies
app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

// ✅ Add movie (Admin)
app.post("/api/add", async (req, res) => {
  const { title, video, poster, category } = req.body;

  if (!title || !video) {
    return res.json({ message: "Missing data" });
  }

  await Movie.create({ title, video, poster, category });
  res.json({ message: "Movie Added" });
});

// ✅ Delete all (optional)
app.delete("/api/delete-all", async (req, res) => {
  await Movie.deleteMany({});
  res.json({ message: "All deleted" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on " + PORT));
