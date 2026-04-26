const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: String,
  link: String,
  poster: String,
  category: String
}, { timestamps: true });

module.exports = mongoose.model("Movie", movieSchema);
