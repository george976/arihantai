const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/hi', (req, res) => {
  res.json({ message: "Hello!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});