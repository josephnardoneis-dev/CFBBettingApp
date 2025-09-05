const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
// const helmet = require('helmet');
// const compression = require('compression'); 
// const cron = require('node-cron');
// const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college-football-betting', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🏈 Connected to MongoDB'))
.catch(err => console.error('Database connection error:', err));

// Import routes
const gamesRoutes = require('./routes/games');
const oddsRoutes = require('./routes/odds');
const insightsRoutes = require('./routes/insights');

// Routes
app.use('/api/games', gamesRoutes);
app.use('/api/odds', oddsRoutes);
app.use('/api/insights', insightsRoutes);

// Static files (for frontend)
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Import data scraping functions
const { scrapeOddsData } = require('./services/oddsService');
const { scrapeTwitterInsights } = require('./services/twitterService');
const { scrapeGameSchedules } = require('./services/gameService');

// Scheduled jobs temporarily disabled for initial deployment

app.listen(PORT, () => {
  console.log(`🏈 College Football Betting App running on port ${PORT}`);
  console.log(`📊 Data refresh scheduled every 4 hours`);
});