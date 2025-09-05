const express = require('express');
  const cors = require('cors');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  const mockGames = [{
    _id: '1',
    homeTeam: { name: 'Alabama', abbreviation: 'ALA', ranking: 1 },
    awayTeam: { name: 'Georgia', abbreviation: 'UGA', ranking: 5 },
    gameTime: new Date(Date.now() + 2*60*60*1000).toISOString(),
    tvBroadcast: 'ESPN',
    odds: []
  }];

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/api/games/today', (req, res) => {
    res.json(mockGames);
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

  app.listen(PORT, () => {
    console.log('🏈 App running on port ' + PORT);
  });
