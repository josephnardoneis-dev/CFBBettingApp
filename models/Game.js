const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  espnId: { type: String, unique: true, required: true },
  homeTeam: {
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    logo: String,
    ranking: Number
  },
  awayTeam: {
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    logo: String,
    ranking: Number
  },
  gameTime: { type: Date, required: true },
  week: { type: Number, required: true },
  season: { type: Number, required: true },
  venue: {
    name: String,
    city: String,
    state: String
  },
  conference: String,
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled'
  },
  weather: {
    temperature: Number,
    conditions: String,
    windSpeed: Number
  },
  tvBroadcast: String,
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient querying
GameSchema.index({ gameTime: 1, status: 1 });
GameSchema.index({ week: 1, season: 1 });

module.exports = mongoose.model('Game', GameSchema);