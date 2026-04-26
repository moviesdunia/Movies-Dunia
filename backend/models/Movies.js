const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: String,
  poster: String,
  videoUrl: String,
  category: String,
  language: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Movie", movieSchema);
