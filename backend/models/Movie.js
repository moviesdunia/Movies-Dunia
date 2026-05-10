const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a movie title"],
    trim: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: [true, "Video URL is mandatory"],
    trim: true
  },
  poster: {
    type: String,
    default: "https://via.placeholder.com/500x750?text=No+Poster+Available"
  },
  category: {
    type: String,
    required: [true, "Please specify a category"],
    lowercase: true,
    trim: true,
    enum: {
      values: ["action", "comedy", "drama", "horror", "sci-fi", "romance", "documentary", "thriller", "animation"],
      message: "{VALUE} is not a supported category"
    }
  },
  language: {
    type: String,
    default: "English",
    trim: true
  },
  overview: {
    type: String,
    trim: true,
    maxlength: [2000, "Overview is too long (max 2000 characters)"]
  }
}, { 
  timestamps: true 
});

// Export the model
module.exports = mongoose.model("Movie", movieSchema
                               );
