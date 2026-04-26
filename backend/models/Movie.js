const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  poster: String,
  category: String,
  language: String,
  overview: String,
}, { timestamps: true });

module.exports = mongoose.model("Movie", movieSchema);
