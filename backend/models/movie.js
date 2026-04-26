const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  poster: String,
  category: String,
  language: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Movie', movieSchema);
