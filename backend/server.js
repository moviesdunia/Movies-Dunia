const axios = require('axios');

app.post('/webhook', async (req, res) => {
  try {
    const message = req.body.channel_post;

    if (message && message.text) {
      const text = message.text;

      // 🎥 Fetch movie poster from OMDB
      let poster = "";
      try {
        const response = await axios.get(
  `https://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=eee94f23`
);

const poster = response.data.Poster;
const rating = response.data.imdbRating;
      }

      // 🎭 Detect category
      let category = "Other";
      if (text.toLowerCase().includes("hindi")) category = "Hindi";
      else if (text.toLowerCase().includes("tamil")) category = "Tamil";
      else if (text.toLowerCase().includes("bengali")) category = "Bengali";

      await Movie.create({
        title: text,
        link: "https://t.me/MoviesUNeed",
        poster,
        category
      });

      console.log("Saved:", text);
    }

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});
