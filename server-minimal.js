const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Basic API endpoint
app.get('/api/games/today', (req, res) => {
  res.json([
    {
      _id: '1',
      homeTeam: { name: 'Alabama', abbreviation: 'ALA' },
      awayTeam: { name: 'Georgia', abbreviation: 'UGA' },
      gameTime: new Date().toISOString(),
      odds: []
    }
  ]);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`🏈 App running on port ${PORT}`);
});