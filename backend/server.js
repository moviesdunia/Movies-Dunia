const express = require("express");
const cors = require("cors");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "..")));

// ✅ API: Get videos
app.get("/api/videos", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("resource_type:video")
      .sort_by("created_at", "desc")
      .max_results(50)
      .execute();

    res.json(result.resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Default route (IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(5000, () => console.log("Server running on port 5000"));
