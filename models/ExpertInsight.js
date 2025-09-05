const mongoose = require('mongoose');

const ExpertInsightSchema = new mongoose.Schema({
  twitterHandle: { type: String, required: true },
  expertName: { type: String, required: true },
  
  // Tweet data
  tweetId: { type: String, unique: true, required: true },
  content: { type: String, required: true },
  tweetUrl: String,
  timestamp: { type: Date, required: true },
  
  // Engagement metrics
  likes: { type: Number, default: 0 },
  retweets: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  
  // Related games (if mentioned)
  relatedGames: [{
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    teams: [String], // Team names/abbreviations mentioned
    confidence: Number // 0-1 score of relevance
  }],
  
  // Analysis
  sentiment: {
    score: { type: Number, min: -1, max: 1 }, // -1 (negative) to 1 (positive)
    label: { type: String, enum: ['positive', 'negative', 'neutral'] }
  },
  
  // Betting context
  bettingContext: {
    mentionsBet: { type: Boolean, default: false },
    betType: String, // 'spread', 'moneyline', 'total', 'prop'
    teams: [String],
    pick: String, // Expert's actual pick
    confidence: String // 'low', 'medium', 'high'
  },
  
  // Categories
  categories: [{
    type: String,
    enum: [
      'game_preview',
      'betting_pick', 
      'injury_update',
      'weather_impact',
      'line_movement',
      'value_bet',
      'fade_public',
      'model_analysis',
      'breaking_news'
    ]
  }],
  
  // Expert credibility metrics
  expertMetrics: {
    followerCount: Number,
    isVerified: { type: Boolean, default: false },
    credibilityScore: { type: Number, min: 0, max: 100 }, // Our internal scoring
    recentAccuracy: Number, // Percentage of correct picks recently
    specialties: [String] // ['college_football', 'props', 'totals', etc.]
  },
  
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for efficient querying
ExpertInsightSchema.index({ timestamp: -1 });
ExpertInsightSchema.index({ 'relatedGames.gameId': 1 });
ExpertInsightSchema.index({ twitterHandle: 1, timestamp: -1 });
ExpertInsightSchema.index({ categories: 1 });
ExpertInsightSchema.index({ 'bettingContext.mentionsBet': 1 });

module.exports = mongoose.model('ExpertInsight', ExpertInsightSchema);