const axios = require('axios');
const cheerio = require('cheerio');
const Game = require('../models/Game');
const Odds = require('../models/Odds');

class OddsService {
  constructor() {
    this.theOddsApiKey = process.env.THE_ODDS_API_KEY;
    this.baseUrl = 'https://api.the-odds-api.com/v4';
  }

  async scrapeOddsData() {
    console.log('🔄 Starting odds data scraping...');
    
    try {
      // Scrape from multiple sources in parallel
      await Promise.allSettled([
        this.scrapeFromTheOddsAPI(),
        this.scrapeFromESPN(),
        this.scrapeFromOddsShark()
      ]);
      
      console.log('✅ Odds data scraping completed');
    } catch (error) {
      console.error('❌ Error in odds scraping:', error);
    }
  }

  async scrapeFromTheOddsAPI() {
    if (!this.theOddsApiKey) {
      console.log('⚠️ The Odds API key not configured');
      return;
    }

    try {
      console.log('📊 Fetching from The Odds API...');
      
      const response = await axios.get(`${this.baseUrl}/sports/americanfootball_ncaaf/odds`, {
        params: {
          api_key: this.theOddsApiKey,
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          bookmakers: 'draftkings,fanduel,betmgm,caesars,betrivers'
        }
      });

      const events = response.data;
      
      for (const event of events) {
        await this.processTheOddsAPIEvent(event);
      }
      
      console.log(`✅ Processed ${events.length} events from The Odds API`);
    } catch (error) {
      console.error('❌ Error fetching from The Odds API:', error.message);
    }
  }

  async processTheOddsAPIEvent(event) {
    try {
      // Find corresponding game in database
      const game = await Game.findOne({
        $or: [
          { 
            'homeTeam.name': { $regex: new RegExp(event.home_team, 'i') },
            'awayTeam.name': { $regex: new RegExp(event.away_team, 'i') }
          }
        ]
      });

      if (!game) {
        console.log(`⚠️ Game not found for ${event.away_team} @ ${event.home_team}`);
        return;
      }

      // Process each bookmaker's odds
      for (const bookmaker of event.bookmakers) {
        const oddsData = {
          gameId: game._id,
          sportsbook: this.mapBookmakerName(bookmaker.key),
          spread: {},
          moneyline: {},
          total: {},
          lastUpdated: new Date()
        };

        // Process markets
        for (const market of bookmaker.markets) {
          switch (market.key) {
            case 'h2h': // Moneyline
              const homeML = market.outcomes.find(o => o.name === event.home_team);
              const awayML = market.outcomes.find(o => o.name === event.away_team);
              oddsData.moneyline = {
                home: homeML?.price || null,
                away: awayML?.price || null
              };
              break;

            case 'spreads':
              const homeSpread = market.outcomes.find(o => o.name === event.home_team);
              const awaySpread = market.outcomes.find(o => o.name === event.away_team);
              oddsData.spread = {
                home: homeSpread?.point || null,
                away: awaySpread?.point || null,
                homeOdds: homeSpread?.price || null,
                awayOdds: awaySpread?.price || null
              };
              break;

            case 'totals':
              const overOutcome = market.outcomes.find(o => o.name === 'Over');
              const underOutcome = market.outcomes.find(o => o.name === 'Under');
              oddsData.total = {
                points: overOutcome?.point || null,
                over: overOutcome?.price || null,
                under: underOutcome?.price || null
              };
              break;
          }
        }

        // Save or update odds
        await this.saveOddsData(oddsData);
      }

    } catch (error) {
      console.error('Error processing The Odds API event:', error);
    }
  }

  async scrapeFromESPN() {
    try {
      console.log('📊 Fetching from ESPN API...');
      
      // Get college football scoreboard
      const response = await axios.get(
        'http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
        { timeout: 10000 }
      );

      const events = response.data.events || [];
      
      for (const event of events) {
        await this.processESPNEvent(event);
      }
      
      console.log(`✅ Processed ${events.length} events from ESPN`);
    } catch (error) {
      console.error('❌ Error fetching from ESPN:', error.message);
    }
  }

  async processESPNEvent(event) {
    try {
      // Extract teams
      const homeTeam = event.competitions[0].competitors.find(c => c.homeAway === 'home');
      const awayTeam = event.competitions[0].competitors.find(c => c.homeAway === 'away');

      // Find game in database
      const game = await Game.findOne({
        $or: [
          { espnId: event.id },
          {
            'homeTeam.name': { $regex: new RegExp(homeTeam.team.displayName, 'i') },
            'awayTeam.name': { $regex: new RegExp(awayTeam.team.displayName, 'i') }
          }
        ]
      });

      if (!game) {
        console.log(`⚠️ Game not found for ESPN event ${event.id}`);
        return;
      }

      // Process odds if available
      const odds = event.competitions[0].odds;
      if (odds && odds.length > 0) {
        for (const odd of odds) {
          const oddsData = {
            gameId: game._id,
            sportsbook: 'ESPN',
            spread: {
              home: odd.spread || null,
              away: odd.spread ? -odd.spread : null,
              homeOdds: -110, // Default
              awayOdds: -110  // Default
            },
            total: {
              points: odd.overUnder || null,
              over: -110,
              under: -110
            },
            lastUpdated: new Date()
          };

          await this.saveOddsData(oddsData);
        }
      }

    } catch (error) {
      console.error('Error processing ESPN event:', error);
    }
  }

  async scrapeFromOddsShark() {
    try {
      console.log('📊 Scraping from OddsShark...');
      
      const response = await axios.get('https://www.oddsshark.com/ncaaf/odds', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Parse odds table (this is a simplified example - actual implementation would be more complex)
      $('.op-matchup-container').each(async (index, element) => {
        try {
          const teams = $(element).find('.op-team-name').map((i, el) => $(el).text().trim()).get();
          const spreads = $(element).find('.op-spread').map((i, el) => $(el).text().trim()).get();
          
          if (teams.length >= 2 && spreads.length >= 2) {
            // Process the scraped data
            await this.processOddsSharkData(teams, spreads);
          }
        } catch (error) {
          console.error('Error parsing OddsShark element:', error);
        }
      });
      
      console.log('✅ OddsShark scraping completed');
    } catch (error) {
      console.error('❌ Error scraping OddsShark:', error.message);
    }
  }

  async processOddsSharkData(teams, spreads) {
    // Implementation would map scraped data to database format
    // This is a simplified placeholder
  }

  async saveOddsData(oddsData) {
    try {
      // Check if we already have odds for this game/sportsbook
      const existingOdds = await Odds.findOne({
        gameId: oddsData.gameId,
        sportsbook: oddsData.sportsbook
      }).sort({ lastUpdated: -1 });

      if (existingOdds) {
        // Check for line movements
        const movements = this.detectLineMovements(existingOdds, oddsData);
        
        // Add to history
        existingOdds.oddsHistory.push({
          timestamp: new Date(),
          spread: existingOdds.spread,
          total: existingOdds.total ? existingOdds.total.points : null,
          moneylineHome: existingOdds.moneyline ? existingOdds.moneyline.home : null,
          moneylineAway: existingOdds.moneyline ? existingOdds.moneyline.away : null
        });

        // Update with new data
        Object.assign(existingOdds, oddsData);
        existingOdds.spread.lastMovement = movements.spread;
        existingOdds.total.lastMovement = movements.total;
        
        await existingOdds.save();
      } else {
        // Create new odds record
        const newOdds = new Odds(oddsData);
        await newOdds.save();
      }
    } catch (error) {
      console.error('Error saving odds data:', error);
    }
  }

  detectLineMovements(oldOdds, newOdds) {
    const movements = { spread: 'none', total: 'none' };

    // Detect spread movement
    if (oldOdds.spread?.home && newOdds.spread?.home) {
      if (newOdds.spread.home > oldOdds.spread.home) {
        movements.spread = 'up';
      } else if (newOdds.spread.home < oldOdds.spread.home) {
        movements.spread = 'down';
      }
    }

    // Detect total movement
    if (oldOdds.total?.points && newOdds.total?.points) {
      if (newOdds.total.points > oldOdds.total.points) {
        movements.total = 'up';
      } else if (newOdds.total.points < oldOdds.total.points) {
        movements.total = 'down';
      }
    }

    return movements;
  }

  mapBookmakerName(key) {
    const mapping = {
      'draftkings': 'DraftKings',
      'fanduel': 'FanDuel',
      'betmgm': 'BetMGM',
      'caesars': 'Caesars',
      'betrivers': 'BetRivers',
      'espnbet': 'ESPN BET',
      'bet365': 'Bet365'
    };
    return mapping[key] || key;
  }
}

const oddsService = new OddsService();

module.exports = {
  scrapeOddsData: () => oddsService.scrapeOddsData()
};