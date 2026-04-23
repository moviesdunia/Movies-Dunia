const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ TEST ROUTE
app.get('/', (req, res) => {
  res.send("Backend Working 🚀");
});

// ✅ API ROUTE
app.get('/api/movies', (req, res) => {
  res.json([]);
});

// ✅ IMPORTANT (Railway port)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
