const axios = require('axios');
const Game = require('../models/Game');

class GameService {
  constructor() {
    this.espnApiBase = 'http://site.api.espn.com/apis/site/v2/sports/football/college-football';
    this.cfbDataApiBase = 'https://api.collegefootballdata.com';
  }

  async scrapeGameSchedules() {
    console.log('📅 Starting game schedules scraping...');
    
    try {
      await Promise.allSettled([
        this.scrapeFromESPN(),
        this.scrapeFromCFBData()
      ]);
      
      console.log('✅ Game schedules scraping completed');
    } catch (error) {
      console.error('❌ Error in game schedules scraping:', error);
    }
  }

  async scrapeFromESPN() {
    try {
      console.log('📊 Fetching schedules from ESPN...');
      
      // Get current week and season
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const season = currentDate.getMonth() >= 8 ? currentYear : currentYear - 1;
      
      // Get scoreboard for multiple weeks
      for (let week = 1; week <= 17; week++) {
        try {
          await this.scrapeESPNWeek(season, week);
          await this.delay(1000); // Rate limiting
        } catch (error) {
          console.error(`Error scraping week ${week}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching from ESPN:', error.message);
    }
  }

  async scrapeESPNWeek(season, week) {
    try {
      const response = await axios.get(`${this.espnApiBase}/scoreboard`, {
        params: {
          groups: '80', // FBS
          seasontype: '2', // Regular season
          week: week,
          year: season
        },
        timeout: 10000
      });

      const events = response.data.events || [];
      
      for (const event of events) {
        await this.processESPNGame(event, season, week);
      }
      
      console.log(`✅ Processed ${events.length} games for week ${week}`);
      
    } catch (error) {
      if (!error.message.includes('404')) {
        console.error(`Error fetching ESPN week ${week}:`, error.message);
      }
    }
  }

  async processESPNGame(event, season, week) {
    try {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
      
      if (!homeTeam || !awayTeam) return;

      const gameData = {
        espnId: event.id,
        homeTeam: {
          name: homeTeam.team.displayName,
          abbreviation: homeTeam.team.abbreviation,
          logo: homeTeam.team.logo,
          ranking: homeTeam.curatedRank?.current
        },
        awayTeam: {
          name: awayTeam.team.displayName,
          abbreviation: awayTeam.team.abbreviation,
          logo: awayTeam.team.logo,
          ranking: awayTeam.curatedRank?.current
        },
        gameTime: new Date(event.date),
        week: week,
        season: season,
        venue: {
          name: competition.venue?.fullName,
          city: competition.venue?.address?.city,
          state: competition.venue?.address?.state
        },
        status: this.mapGameStatus(competition.status.type.name),
        tvBroadcast: competition.broadcasts?.[0]?.names?.[0],
        lastUpdated: new Date()
      };

      // Update or create game
      await Game.findOneAndUpdate(
        { espnId: event.id },
        gameData,
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Error processing ESPN game:', error);
    }
  }

  async scrapeFromCFBData() {
    try {
      console.log('📊 Fetching from College Football Data API...');
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const season = currentDate.getMonth() >= 8 ? currentYear : currentYear - 1;
      
      // Get games for current season
      const response = await axios.get(`${this.cfbDataApiBase}/games`, {
        params: {
          year: season,
          seasonType: 'regular',
          division: 'fbs'
        },
        timeout: 15000
      });

      const games = response.data || [];
      
      for (const game of games) {
        await this.processCFBDataGame(game, season);
      }
      
      console.log(`✅ Processed ${games.length} games from CFB Data API`);
      
    } catch (error) {
      console.error('❌ Error fetching from CFB Data API:', error.message);
    }
  }

  async processCFBDataGame(game, season) {
    try {
      if (!game.home_team || !game.away_team) return;

      const gameData = {
        espnId: game.id?.toString(),
        homeTeam: {
          name: game.home_team,
          abbreviation: this.getTeamAbbreviation(game.home_team),
          ranking: game.home_pregame_elo ? Math.round(game.home_pregame_elo / 100) : null
        },
        awayTeam: {
          name: game.away_team,
          abbreviation: this.getTeamAbbreviation(game.away_team),
          ranking: game.away_pregame_elo ? Math.round(game.away_pregame_elo / 100) : null
        },
        gameTime: new Date(game.start_date),
        week: game.week,
        season: season,
        venue: {
          name: game.venue,
          city: game.venue_city,
          state: game.venue_state
        },
        conference: game.home_conference || game.away_conference,
        status: game.completed ? 'completed' : 'scheduled',
        lastUpdated: new Date()
      };

      // Only update if we don't have ESPN data for this game
      const existingGame = await Game.findOne({
        $or: [
          { espnId: game.id?.toString() },
          {
            'homeTeam.name': { $regex: new RegExp(game.home_team, 'i') },
            'awayTeam.name': { $regex: new RegExp(game.away_team, 'i') },
            week: game.week,
            season: season
          }
        ]
      });

      if (!existingGame) {
        const newGame = new Game(gameData);
        await newGame.save();
      } else if (!existingGame.espnId && game.id) {
        // Update with CFB Data API info if we only have partial data
        existingGame.espnId = game.id.toString();
        existingGame.conference = gameData.conference;
        await existingGame.save();
      }

    } catch (error) {
      console.error('Error processing CFB Data game:', error);
    }
  }

  mapGameStatus(espnStatus) {
    const statusMap = {
      'STATUS_SCHEDULED': 'scheduled',
      'STATUS_IN_PROGRESS': 'in-progress',
      'STATUS_FINAL': 'completed',
      'STATUS_HALFTIME': 'in-progress',
      'STATUS_END_PERIOD': 'in-progress'
    };
    return statusMap[espnStatus] || 'scheduled';
  }

  getTeamAbbreviation(teamName) {
    // Simple abbreviation mapping - in production, use comprehensive database
    const abbreviations = {
      'Alabama': 'ALA',
      'Georgia': 'UGA',
      'Ohio State': 'OSU',
      'Michigan': 'MICH',
      'Oklahoma': 'OU',
      'Texas': 'TEX',
      'Clemson': 'CLEM',
      'Notre Dame': 'ND',
      'USC': 'USC',
      'Oregon': 'ORE',
      'Florida': 'FLA',
      'LSU': 'LSU',
      'Auburn': 'AUB',
      'Tennessee': 'TENN',
      'Penn State': 'PSU',
      'Wisconsin': 'WIS',
      'Iowa': 'IOWA',
      'Nebraska': 'NEB',
      'Texas A&M': 'TAMU',
      'Arkansas': 'ARK',
      'Kentucky': 'UK',
      'Mississippi': 'MISS',
      'Mississippi State': 'MSST',
      'Missouri': 'MIZ',
      'South Carolina': 'SC',
      'Vanderbilt': 'VAN',
      'Florida State': 'FSU',
      'Miami': 'MIA',
      'Virginia Tech': 'VT',
      'North Carolina': 'UNC',
      'Duke': 'DUKE',
      'Wake Forest': 'WAKE',
      'Louisville': 'LOU',
      'Pittsburgh': 'PITT',
      'Syracuse': 'SYR',
      'Boston College': 'BC',
      'Virginia': 'UVA',
      'Georgia Tech': 'GT',
      'Washington': 'WASH',
      'Stanford': 'STAN',
      'California': 'CAL',
      'UCLA': 'UCLA',
      'Arizona': 'ARIZ',
      'Arizona State': 'ASU',
      'Colorado': 'COL',
      'Utah': 'UTAH',
      'Washington State': 'WSU',
      'Oregon State': 'OSU'
    };

    return abbreviations[teamName] || teamName.substring(0, 4).toUpperCase();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const gameService = new GameService();

module.exports = {
  scrapeGameSchedules: () => gameService.scrapeGameSchedules()
};