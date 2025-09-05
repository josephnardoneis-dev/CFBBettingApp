# 🏈 College Football Betting Hub

A comprehensive web application that aggregates college football betting lines, expert insights, and analytics from multiple sources with automatic 4-hour refresh cycles.

## ✨ Features

### 📊 **Real-time Betting Data**
- Live odds from 7+ major sportsbooks (DraftKings, FanDuel, BetMGM, Caesars, etc.)
- Point spreads, moneylines, totals, and player props
- Line movement tracking with historical data
- Cross-sportsbook odds comparison
- Best odds finder

### 🐦 **Expert Insights** 
- Automated Twitter scraping from 20+ verified CFB betting experts
- Sentiment analysis and pick categorization
- Expert credibility scoring and rankings
- Game-specific insight matching using NLP
- Trending analysis based on engagement

### 🎯 **Smart Features**
- Automatic game-expert content correlation
- Line movement alerts and notifications  
- Historical odds tracking and analysis
- Responsive design for all devices
- Real-time data updates every 4 hours

## 🏗️ Architecture

### Backend
- **Node.js/Express** - RESTful API server
- **MongoDB** - Document database with Mongoose ODM
- **Scheduled Jobs** - Node-cron for automated data refresh
- **Web Scraping** - Axios, Cheerio, Puppeteer for data collection

### Frontend  
- **Vanilla JavaScript** - Modern ES6+ with component architecture
- **CSS3** - Custom design system with animations
- **Responsive Design** - Mobile-first approach

### Data Sources
- **The Odds API** - Primary betting lines provider
- **ESPN API** - Game schedules and team data
- **College Football Data API** - Additional statistics
- **Twitter/Nitter** - Expert insights via web scraping

## 🚀 Deployment

### Render (Recommended)

1. **Connect Repository**
   ```bash
   git clone https://github.com/your-username/college-football-betting-app
   cd college-football-betting-app
   ```

2. **Environment Variables**
   Set these in your Render dashboard:
   ```
   NODE_ENV=production
   THE_ODDS_API_KEY=your_api_key
   MONGODB_URI=(auto-generated from database)
   ```

3. **Deploy**
   - Render will automatically detect `render.yaml`
   - Database and web service will be created
   - App will be available at your Render URL

### Manual Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Application**
   ```bash
   # Development
   npm run dev
   
   # Production  
   npm start
   ```

## 🔧 Configuration

### Required API Keys

1. **The Odds API** (Free tier: 500 requests/month)
   - Sign up at [the-odds-api.com](https://the-odds-api.com)
   - Add key to `THE_ODDS_API_KEY` environment variable

2. **MongoDB Database**
   - Use MongoDB Atlas (free tier available)
   - Or local MongoDB instance
   - Set connection string in `MONGODB_URI`

### Optional API Keys

- **Twitter API** - For official Twitter integration (if implemented)
- Custom rate limiting and caching configurations

## 📱 Usage

### Main Dashboard
- View all today's games with live betting lines
- Click any game for detailed odds comparison
- Filter games by ranked teams, conferences, etc.

### Expert Insights
- Browse latest expert picks and analysis
- Filter by category (picks, line movements, injuries, etc.)
- View expert credibility scores and track records

### Odds Comparison  
- Compare spreads, moneylines, totals across sportsbooks
- View line movements and historical data
- Find best odds for any bet type

### Game Details
- Comprehensive game information with team stats
- All available player and team props
- Expert insights specific to the game
- Historical odds data and movements

## 🛠️ Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/your-username/college-football-betting-app
cd college-football-betting-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB (if running locally)
mongod

# Start development server
npm run dev
```

### Manual Data Scraping
```bash
# Run manual data collection (useful for testing)
npm run scrape
```

### API Endpoints

#### Games
- `GET /api/games/today` - Today's games
- `GET /api/games/week/:week/:season` - Games by week
- `GET /api/games/:gameId` - Game details

#### Odds  
- `GET /api/odds/game/:gameId` - Game odds
- `GET /api/odds/compare/:gameId/:market` - Odds comparison
- `GET /api/odds/movements/today` - Line movements

#### Insights
- `GET /api/insights/latest` - Latest expert insights  
- `GET /api/insights/game/:gameId` - Game-specific insights
- `GET /api/insights/trending` - Trending insights

## 🎯 Key Technologies

- **Node.js 20.x** - Runtime environment
- **Express.js** - Web framework
- **MongoDB/Mongoose** - Database and ODM
- **Axios** - HTTP client for API calls
- **Cheerio** - Server-side HTML parsing
- **Node-cron** - Scheduled jobs
- **CSS Grid/Flexbox** - Modern layouts
- **Font Awesome** - Icons
- **Inter/JetBrains Mono** - Typography

## 🔒 Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API protection  
- **CORS** - Cross-origin configuration
- **Input Validation** - Data sanitization
- **Error Handling** - Graceful failure modes

## 📊 Performance

- **Caching** - 5-minute API response cache
- **Compression** - Gzip compression for static assets  
- **Lazy Loading** - Efficient data loading
- **Responsive Images** - Team logos and graphics
- **Background Jobs** - Non-blocking data updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **The Odds API** for comprehensive betting data
- **ESPN** for game schedules and team information
- **College Football Data** for additional statistics
- **CFB Betting Community** for expert insight sources

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/college-football-betting-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/college-football-betting-app/discussions)

---

## 🎮 Quick Start Commands

```bash
# Development
npm run dev          # Start development server
npm run scrape       # Manual data collection

# Production
npm start            # Start production server
npm install          # Install dependencies
```

**Live Demo**: [Your Render URL]

**Built with ❤️ for the college football betting community**