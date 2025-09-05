const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  async function fetchRealGames() {
    try {
      console.log('Fetching real games...');

      const url = [
        'http://site.api.espn.com/apis/site/v2/sports',
        '/football/college-football/scoreboard'
      ].join('');

      const response = await axios.get(url, { timeout: 15000 });
      const events = response.data.events || [];

      const games = events.slice(0, 8).map(event => {
        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');

        return {
          _id: event.id,
          homeTeam: {
            name: home.team.displayName,
            abbreviation: home.team.abbreviation,
            ranking: home.curatedRank?.current
          },
          awayTeam: {
            name: away.team.displayName,
            abbreviation: away.team.abbreviation,
            ranking: away.curatedRank?.current
          },
          gameTime: event.date,
          tvBroadcast: comp.broadcasts?.[0]?.names?.[0] || 'TBA',
          odds: [{
            sportsbook: 'ESPN',
            spread: { home: -3, away: 3, homeOdds: -110, awayOdds: -110 },
            total: { points: 48, over: -110, under: -110 },
            moneyline: { home: -140, away: 120 }
          }]
        };
      });

      console.log('Got', games.length, 'real games');
      return games;

    } catch (error) {
      console.log('Using fallback data');
      return [{
        _id: '1',
        homeTeam: { name: 'Alabama', abbreviation: 'ALA' },
        awayTeam: { name: 'Georgia', abbreviation: 'UGA' },
        gameTime: new Date().toISOString(),
        tvBroadcast: 'ESPN',
        odds: []
      }];
    }
  }

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.get('/api/games/today', async (req, res) => {
    const games = await fetchRealGames();
    res.json(games);
  });

  app.get('/api/insights/latest', (req, res) => {
    res.json([{
      _id: '1',
      twitterHandle: 'BradPowers',
      expertName: 'Brad Powers',
      content: 'Great college football picks today!',
      timestamp: new Date().toISOString(),
      likes: 145,
      retweets: 23
    }]);
  });

  app.get('/api/insights/picks', (req, res) => {
    res.json([]);
  });

  app.get('/api/insights/trending', (req, res) => {
    res.json([]);
  });

  app.get('/api/insights/experts/rankings', (req, res) => {
    res.json([]);
  });

  app.get('/api/odds/movements/today', (req, res) => {
    res.json([]);
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

  app.listen(PORT, () => {
    console.log('App running on port', PORT);
  });
