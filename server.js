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
    odds: [{
      sportsbook: 'DraftKings',
      spread: { home: -3.5, away: 3.5, homeOdds: -110, awayOdds: -110 },
      total: { points: 52.5, over: -110, under: -110 },
      moneyline: { home: -165, away: +145 }
    }]
  }];

  const mockInsights = [{
    _id: '1',
    twitterHandle: 'BradPowers',
    expertName: 'Brad Powers',
    content: 'Alabama -3.5 looks like solid value!',
    timestamp: new Date(Date.now() - 30*60*1000).toISOString(),
    likes: 145,
    retweets: 23,
    replies: 8,
    categories: ['betting_pick'],
    bettingContext: { mentionsBet: true, betType: 'spread', confidence:
  'high' },
    expertMetrics: { isVerified: true }
  }];

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/api/games/today', (req, res) => {
    res.json(mockGames);
  });

  app.get('/api/insights/latest', (req, res) => {
    res.json(mockInsights);
  });

  app.get('/api/insights/picks', (req, res) => {
    res.json(mockInsights);
  });

  app.get('/api/insights/trending', (req, res) => {
    res.json(mockInsights);
  });

  app.get('/api/insights/experts/rankings', (req, res) => {
    res.json([
      { _id: 'BradPowers', expertName: 'Brad Powers', avgAccuracy: 68.5,
  totalPicks: 145 }
    ]);
  });

  app.get('/api/odds/movements/today', (req, res) => {
    res.json([]);
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

  app.listen(PORT, () => {
    console.log('App running on port ' + PORT);
  });
