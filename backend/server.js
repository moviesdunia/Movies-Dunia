require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "video" },
      (error, result) => {
        if (error) return res.status(500).json(error);
        res.json(result);
      }
    );

    result.end(req.file.buffer);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get video list
app.get("/videos", async (req, res) => {
  const result = await cloudinary.search
    .expression("resource_type:video")
    .sort_by("created_at", "desc")
    .max_results(30)
    .execute();

  res.json(result.resources);
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
