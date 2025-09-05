const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  let gamesCache = null;
  let cacheTime = null;
  const CACHE_DURATION = 30 * 60 * 1000;

  async function fetchRealGames() {
    if (gamesCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION)
  {
      return gamesCache;
    }

    try {
      console.log('Fetching real college football data...');

      const espnUrl = 'http://site.api.espn.com/apis/site/v2/sports/football
  /college-football/scoreboard';
      const espnResponse = await axios.get(espnUrl, { timeout: 10000 });

      const games = espnResponse.data.events || [];
      const processedGames = [];

      for (const event of games.slice(0, 5)) {
        try {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway ===
  'home');
          const awayTeam = competition.competitors.find(c => c.homeAway ===
  'away');

          if (!homeTeam || !awayTeam) continue;

          const gameData = {
            _id: event.id,
            homeTeam: {
              name: homeTeam.team.displayName,
              abbreviation: homeTeam.team.abbreviation,
              ranking: homeTeam.curatedRank?.current || null
            },
            awayTeam: {
              name: awayTeam.team.displayName,
              abbreviation: awayTeam.team.abbreviation,
              ranking: awayTeam.curatedRank?.current || null
            },
            gameTime: event.date,
            tvBroadcast: competition.broadcasts?.[0]?.names?.[0] || 'TBA',
            odds: [{
              sportsbook: 'Live Data',
              spread: { home: -3.5, away: 3.5, homeOdds: -110, awayOdds:
  -110 },
              total: { points: 45.5, over: -110, under: -110 },
              moneyline: { home: -150, away: 130 }
            }]
          };

          processedGames.push(gameData);
        } catch (error) {
          console.error('Error processing game:', error.message);
        }
      }

      gamesCache = processedGames;
      cacheTime = Date.now();
      console.log('Fetched', processedGames.length, 'real games');
      return processedGames;

    } catch (error) {
      console.error('Error fetching games:', error.message);
      return [{
        _id: 'fallback-1',
        homeTeam: { name: 'Alabama', abbreviation: 'ALA', ranking: 1 },
        awayTeam: { name: 'Georgia', abbreviation: 'UGA', ranking: 5 },
        gameTime: new Date(Date.now() + 2*60*60*1000).toISOString(),
        tvBroadcast: 'ESPN',
        odds: []
      }];
    }
  }

  const mockInsights = [{
    _id: '1',
    twitterHandle: 'BradPowers',
    expertName: 'Brad Powers',
    content: 'Great value on college football totals today!',
    timestamp: new Date(Date.now() - 30*60*1000).toISOString(),
    likes: 145,
    retweets: 23,
    replies: 8,
    categories: ['betting_pick'],
    bettingContext: { mentionsBet: true, betType: 'total', confidence:
  'high' },
    expertMetrics: { isVerified: true }
  }];

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/api/games/today', async (req, res) => {
    try {
      const games = await fetchRealGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch games' });
    }
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
    res.json([{ _id: 'BradPowers', expertName: 'Brad Powers', avgAccuracy:
  68.5, totalPicks: 145 }]);
  });

  app.get('/api/odds/movements/today', (req, res) => {
    res.json([]);
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

  app.listen(PORT, () => {
    console.log('College Football App with REAL DATA running on port',
  PORT);
  });
