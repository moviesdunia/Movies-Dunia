const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect("mongodb+srv://admin:Movies%40123@cluster0.2g9c2ox.mongodb.net/moviesdunia")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// ✅ Simple route (test)
app.get('/', (req, res) => {
  res.send("Movies Dunia Backend Running");
});

// ✅ Movies API
app.get('/api/movies', async (req, res) => {
  res.json([]);
});

// ✅ Telegram webhook (basic)
app.post('/webhook', (req, res) => {
  console.log("Webhook received");
  res.sendStatus(200);
});

// ✅ FIXED PORT (important)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
