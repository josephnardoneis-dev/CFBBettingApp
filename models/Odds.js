const mongoose = require('mongoose');

const OddsSchema = new mongoose.Schema({
  gameId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Game', 
    required: true 
  },
  sportsbook: { 
    type: String, 
    required: true,
    enum: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers', 'ESPN BET', 'Bet365']
  },
  
  // Main betting markets
  spread: {
    home: { type: Number },
    away: { type: Number },
    homeOdds: { type: Number },
    awayOdds: { type: Number },
    lastMovement: { type: String, enum: ['up', 'down', 'none'], default: 'none' }
  },
  
  moneyline: {
    home: { type: Number },
    away: { type: Number }
  },
  
  total: {
    points: { type: Number },
    over: { type: Number },
    under: { type: Number },
    lastMovement: { type: String, enum: ['up', 'down', 'none'], default: 'none' }
  },
  
  // Player props
  playerProps: [{
    playerName: String,
    team: String,
    market: String, // 'passing_yards', 'rushing_yards', 'receiving_yards', etc.
    line: Number,
    overOdds: Number,
    underOdds: Number
  }],
  
  // Team props
  teamProps: [{
    team: String, // 'home' or 'away'
    market: String, // 'first_touchdown', 'total_touchdowns', etc.
    line: Number,
    odds: Number
  }],
  
  // Game props
  gameProps: [{
    market: String, // 'first_score', 'longest_touchdown', etc.
    options: [{
      selection: String,
      odds: Number
    }]
  }],
  
  // Historical tracking
  oddsHistory: [{
    timestamp: { type: Date, default: Date.now },
    spread: {
      home: Number,
      away: Number
    },
    total: Number,
    moneylineHome: Number,
    moneylineAway: Number
  }],
  
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
OddsSchema.index({ gameId: 1, sportsbook: 1 });
OddsSchema.index({ lastUpdated: -1 });

module.exports = mongoose.model('Odds', OddsSchema);