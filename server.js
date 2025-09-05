const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.static('public'));

  // Cache to avoid too many API calls
  let gamesCache = null;
  let cacheTime = null;
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  async function fetchRealGames() {
    // Check cache first
    if (gamesCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION)
  {
      return gamesCache;
    }

    try {
      console.log('🏈 Fetching real college football data...');

      // Fetch from ESPN API (free, no key needed)
      const espnResponse = await axios.get(
        'http://site.api.espn.com/apis/site/v2/sports/football/college-footb
  all/scoreboard',
        { timeout: 10000 }
      );

      const games = espnResponse.data.events || [];
      const processedGames = [];

      // Process up to 10 games
      for (const event of games.slice(0, 10)) {
        try {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(c => c.homeAway ===
  'home');
          const awayTeam = competition.competitors.find(c => c.homeAway ===
  'away');

          if (!homeTeam || !awayTeam) continue;

          // Fetch odds from The Odds API
          const oddsData = await fetchOddsForGame(homeTeam.team.displayName,
   awayTeam.team.displayName);

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
            odds: oddsData
          };

          processedGames.push(gameData);
        } catch (error) {
          console.error('Error processing game:', error.message);
        }
      }

      // Update cache
      gamesCache = processedGames;
      cacheTime = Date.now();

      console.log(`✅ Fetched ${processedGames.length} real games`);
      return processedGames;

    } catch (error) {
      console.error('❌ Error fetching real games:', error.message);
      // Return fallback mock data if API fails
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

  async function fetchOddsForGame(homeTeam, awayTeam) {
    if (!process.env.THE_ODDS_API_KEY) {
      return [];
    }

    try {
      const response = await axios.get('https://api.the-odds-api.com/v4/spor
  ts/americanfootball_ncaaf/odds', {
        params: {
          api_key: process.env.THE_ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          bookmakers: 'draftkings,fanduel,betmgm'
        },
        timeout: 10000
      });

      // Find matching game
      const matchingGame = response.data.find(game =>
        game.home_team.toLowerCase().includes(homeTeam.toLowerCase()) ||
        game.away_team.toLowerCase().includes(awayTeam.toLowerCase())
      );

      if (!matchingGame) return [];

      // Process odds from each bookmaker
      const processedOdds = [];
      for (const bookmaker of matchingGame.bookmakers) {
        const oddsData = {
          sportsbook: bookmaker.title,
          spread: {},
          moneyline: {},
          total: {}
        };

        // Process each market
        for (const market of bookmaker.markets) {
          if (market.key === 'h2h') {
            const home = market.outcomes.find(o => o.name ===
  matchingGame.home_team);
            const away = market.outcomes.find(o => o.name ===
  matchingGame.away_team);
            oddsData.moneyline = {
              home: home?.price || null,
              away: away?.price || null
            };
          } else if (market.key === 'spreads') {
            const home = market.outcomes.find(o => o.name ===
  matchingGame.home_team);
            const away = market.outcomes.find(o => o.name ===
  matchingGame.away_team);
            oddsData.spread = {
              home: home?.point || null,
              away: away?.point || null,
              homeOdds: home?.price || null,
              awayOdds: away?.price || null
            };
          } else if (market.key === 'totals') {
            const over = market.outcomes.find(o => o.name === 'Over');
            const under = market.outcomes.find(o => o.name === 'Under');
            oddsData.total = {
              points: over?.point || null,
              over: over?.price || null,
              under: under?.price || null
            };
          }
        }

        processedOdds.push(oddsData);
      }

      return processedOdds;
    } catch (error) {
      console.error('Error fetching odds:', error.message);
      return [];
    }
  }

  // Mock expert insights (we'll make this real later)
  const mockInsights = [{
    _id: '1',
    twitterHandle: 'BradPowers',
    expertName: 'Brad Powers',
    content: 'Watching the college football lines closely today. Some 
  interesting movement on totals.',
    timestamp: new Date(Date.now() - 30*60*1000).toISOString(),
    likes: 145,
    retweets: 23,
    replies: 8,
    categories: ['betting_pick'],
    bettingContext: { mentionsBet: true, betType: 'total', confidence:
  'medium' },
    expertMetrics: { isVerified: true }
  }];

  // API Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  app.get('/api/games/today', async (req, res) => {
    try {
      const games = await fetchRealGames();
      res.json(games);
    } catch (error) {
      console.error('API Error:', error);
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
    console.log('🏈 College Football Betting App with REAL DATA running on 
  port ' + PORT);
  });
