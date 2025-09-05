const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const cron = require('node-cron');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
});

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

// Scheduled data refresh every 4 hours
cron.schedule('0 */4 * * *', async () => {
  console.log('🔄 Starting scheduled data refresh...');
  try {
    await Promise.allSettled([
      scrapeGameSchedules(),
      scrapeOddsData(),
      scrapeTwitterInsights()
    ]);
    console.log('✅ Data refresh completed');
  } catch (error) {
    console.error('❌ Error during scheduled refresh:', error);
  }
});

// Initial data load on startup
setTimeout(async () => {
  console.log('🚀 Loading initial data...');
  try {
    await Promise.allSettled([
      scrapeGameSchedules(),
      scrapeOddsData(),
      scrapeTwitterInsights()
    ]);
    console.log('✅ Initial data load completed');
  } catch (error) {
    console.error('❌ Error during initial data load:', error);
  }
}, 5000);

app.listen(PORT, () => {
  console.log(`🏈 College Football Betting App running on port ${PORT}`);
  console.log(`📊 Data refresh scheduled every 4 hours`);
});