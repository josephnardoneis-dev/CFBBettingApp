const axios = require('axios');
// const cheerio = require('cheerio'); // Temporarily removed
// const puppeteer = require('puppeteer'); // Removed for faster builds
const ExpertInsight = require('../models/ExpertInsight');
const Game = require('../models/Game');

class TwitterService {
  constructor() {
    this.experts = [
      // Top College Football Betting Experts from research
      { handle: 'BradPowers', name: 'Brad Powers', verified: true },
      { handle: 'BarrettSallee', name: 'Barrett Sallee', verified: true },
      { handle: 'TomFornelli', name: 'Tom Fornelli', verified: true },
      { handle: 'ChrisFallica', name: 'Chris Fallica', verified: true },
      { handle: 'CollinWilson', name: 'Collin Wilson', verified: true },
      { handle: 'ToddFuhrman', name: 'Todd Fuhrman', verified: true },
      { handle: 'Payneinsider', name: 'Payne Insider', verified: false },
      { handle: 'DocsSports', name: 'Docs Sports', verified: true },
      { handle: 'adamkramer', name: 'Adam Kramer', verified: true },
      { handle: 'PeteTheGreek', name: 'Pete Fiutak', verified: true },
      { handle: 'FCS_STATS', name: 'FCS Stats', verified: false },
      { handle: 'stevejanus', name: 'Steve Janus', verified: false },
      // Additional experts
      { handle: 'BruceMarshal', name: 'Bruce Marshal', verified: false },
      { handle: 'SportsInsights', name: 'Sports Insights', verified: true },
      { handle: 'TheSharpSide', name: 'The Sharp Side', verified: false },
      { handle: 'BettingPros', name: 'Betting Pros', verified: true },
      { handle: 'ActionNetworkHQ', name: 'Action Network', verified: true },
      { handle: 'VegasInsider', name: 'Vegas Insider', verified: true },
      { handle: 'OddsShark', name: 'OddsShark', verified: true },
      { handle: 'VSiNLive', name: 'VSiN', verified: true }
    ];

    this.collegeFootballKeywords = [
      'college football', 'ncaaf', 'cfb', 'cfp', 'college playoff',
      'alabama', 'georgia', 'ohio state', 'michigan', 'oklahoma',
      'texas', 'clemson', 'notre dame', 'usc', 'oregon',
      'spread', 'moneyline', 'total', 'over', 'under', 'prop bet',
      'line movement', 'sharp money', 'public money', 'fade', 'hammer'
    ];
  }

  async scrapeTwitterInsights() {
    console.log('🐦 Starting Twitter insights scraping...');
    
    try {
      // Use different methods for scraping
      await Promise.allSettled([
        this.scrapeViaPublicFeeds(),
        this.scrapeViaSearch(),
        this.scrapeViaNitter()
      ]);
      
      console.log('✅ Twitter insights scraping completed');
    } catch (error) {
      console.error('❌ Error in Twitter scraping:', error);
    }
  }

  async scrapeViaPublicFeeds() {
    console.log('📡 Scraping via public feeds...');
    
    for (const expert of this.experts.slice(0, 5)) { // Limit for demo
      try {
        await this.scrapeExpertTweets(expert);
        await this.delay(2000); // Rate limiting
      } catch (error) {
        console.error(`Error scraping ${expert.handle}:`, error.message);
      }
    }
  }

  async scrapeExpertTweets(expert) {
    try {
      // Use Nitter (Twitter alternative frontend) for scraping
      const nitterUrl = `https://nitter.net/${expert.handle}`;
      
      const response = await axios.get(nitterUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      $('.timeline-item').each(async (index, element) => {
        try {
          const tweet = await this.parseTweetElement($, element, expert);
          if (tweet && this.isRelevantTweet(tweet.content)) {
            await this.saveTweetInsight(tweet, expert);
          }
        } catch (error) {
          console.error(`Error parsing tweet for ${expert.handle}:`, error);
        }
      });

    } catch (error) {
      // If Nitter fails, try alternative methods
      console.log(`Nitter failed for ${expert.handle}, trying alternatives...`);
      await this.scrapeViaSearch(expert.handle);
    }
  }

  async parseTweetElement($, element, expert) {
    const tweetText = $(element).find('.tweet-content').text().trim();
    const timeStamp = $(element).find('.tweet-date').attr('title');
    const stats = $(element).find('.tweet-stats');
    
    if (!tweetText || !timeStamp) return null;

    return {
      content: tweetText,
      timestamp: new Date(timeStamp),
      likes: this.parseNumber(stats.find('.likes').text()) || 0,
      retweets: this.parseNumber(stats.find('.retweets').text()) || 0,
      replies: this.parseNumber(stats.find('.replies').text()) || 0,
      tweetId: this.generateTweetId(expert.handle, tweetText, timeStamp)
    };
  }

  async scrapeViaSearch(keyword = 'college football betting') {
    console.log(`🔍 Searching for: ${keyword}`);
    
    try {
      // Use a public search engine to find Twitter content
      const searchUrl = `https://www.google.com/search?q=site:twitter.com+"${encodeURIComponent(keyword)}"`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      
      // Parse search results for Twitter links
      $('a[href*="twitter.com"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/status/')) {
          // Extract tweet information from search results
          this.processTweetFromSearch($, element);
        }
      });

    } catch (error) {
      console.error('Error in Twitter search:', error.message);
    }
  }

  async scrapeViaNitter() {
    console.log('🔍 Scraping via Nitter search...');
    
    try {
      const searchTerms = ['college football betting', 'cfb picks', 'ncaaf odds'];
      
      for (const term of searchTerms) {
        const searchUrl = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(term)}`;
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        $('.timeline-item').each(async (index, element) => {
          if (index > 20) return; // Limit results
          
          try {
            const tweet = await this.parseSearchTweet($, element);
            if (tweet && this.isRelevantTweet(tweet.content)) {
              const expert = this.identifyExpert(tweet.handle);
              if (expert) {
                await this.saveTweetInsight(tweet, expert);
              }
            }
          } catch (error) {
            console.error('Error parsing search tweet:', error);
          }
        });

        await this.delay(3000); // Rate limiting
      }

    } catch (error) {
      console.error('Error in Nitter search:', error.message);
    }
  }

  async parseSearchTweet($, element) {
    const handle = $(element).find('.username').text().replace('@', '');
    const content = $(element).find('.tweet-content').text().trim();
    const timeStr = $(element).find('.tweet-date').attr('title');
    
    if (!handle || !content || !timeStr) return null;

    return {
      handle: handle,
      content: content,
      timestamp: new Date(timeStr),
      likes: this.parseNumber($(element).find('.likes').text()) || 0,
      retweets: this.parseNumber($(element).find('.retweets').text()) || 0,
      replies: this.parseNumber($(element).find('.replies').text()) || 0,
      tweetId: this.generateTweetId(handle, content, timeStr)
    };
  }

  isRelevantTweet(content) {
    const lowerContent = content.toLowerCase();
    
    // Check for college football keywords
    const hasCollegeFootball = this.collegeFootballKeywords.some(keyword => 
      lowerContent.includes(keyword.toLowerCase())
    );
    
    // Check for betting context
    const bettingWords = ['bet', 'pick', 'play', 'odds', 'line', 'spread', 'total', 'over', 'under'];
    const hasBetting = bettingWords.some(word => lowerContent.includes(word));
    
    return hasCollegeFootball || hasBetting;
  }

  async saveTweetInsight(tweet, expert) {
    try {
      // Check if tweet already exists
      const existing = await ExpertInsight.findOne({ tweetId: tweet.tweetId });
      if (existing) return;

      // Analyze tweet content
      const analysis = this.analyzeTweetContent(tweet.content);
      const relatedGames = await this.findRelatedGames(tweet.content);

      const insight = new ExpertInsight({
        twitterHandle: expert.handle,
        expertName: expert.name,
        tweetId: tweet.tweetId,
        content: tweet.content,
        timestamp: tweet.timestamp,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        relatedGames: relatedGames,
        sentiment: analysis.sentiment,
        bettingContext: analysis.bettingContext,
        categories: analysis.categories,
        expertMetrics: {
          isVerified: expert.verified,
          followerCount: this.getEstimatedFollowers(expert.handle),
          credibilityScore: this.calculateCredibilityScore(expert),
          specialties: ['college_football']
        }
      });

      await insight.save();
      console.log(`💾 Saved insight from @${expert.handle}`);

    } catch (error) {
      console.error('Error saving tweet insight:', error);
    }
  }

  analyzeTweetContent(content) {
    const lowerContent = content.toLowerCase();
    
    // Sentiment analysis (simple)
    const positiveWords = ['win', 'hammer', 'lock', 'confident', 'strong', 'value'];
    const negativeWords = ['fade', 'avoid', 'stay away', 'trap', 'scary'];
    
    let sentimentScore = 0;
    positiveWords.forEach(word => {
      if (lowerContent.includes(word)) sentimentScore += 0.2;
    });
    negativeWords.forEach(word => {
      if (lowerContent.includes(word)) sentimentScore -= 0.2;
    });
    
    const sentiment = {
      score: Math.max(-1, Math.min(1, sentimentScore)),
      label: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral'
    };

    // Betting context analysis
    const bettingContext = {
      mentionsBet: /\b(bet|play|pick|take|hammer|lock)\b/i.test(content),
      betType: this.identifyBetType(content),
      teams: this.extractTeams(content),
      pick: this.extractPick(content),
      confidence: this.assessConfidence(content)
    };

    // Categorize
    const categories = this.categorizeTweet(content);

    return { sentiment, bettingContext, categories };
  }

  identifyBetType(content) {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('spread') || lowerContent.includes('points')) return 'spread';
    if (lowerContent.includes('moneyline') || lowerContent.includes('ml')) return 'moneyline';
    if (lowerContent.includes('total') || lowerContent.includes('over') || lowerContent.includes('under')) return 'total';
    if (lowerContent.includes('prop')) return 'prop';
    return null;
  }

  extractTeams(content) {
    // Simple team extraction - in production, you'd use a comprehensive team database
    const teams = [];
    const teamPatterns = [
      /alabama/i, /georgia/i, /ohio state/i, /michigan/i, /oklahoma/i,
      /texas/i, /clemson/i, /notre dame/i, /usc/i, /oregon/i
    ];
    
    teamPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        teams.push(pattern.source.replace(/[\/\\gi]/g, ''));
      }
    });
    
    return teams;
  }

  extractPick(content) {
    // Extract betting picks from tweet content
    const pickPatterns = [
      /taking\s+([^\.]+)/i,
      /play\s+([^\.]+)/i,
      /hammer\s+([^\.]+)/i,
      /like\s+([^\.]+)/i
    ];
    
    for (const pattern of pickPatterns) {
      const match = content.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  assessConfidence(content) {
    const lowerContent = content.toLowerCase();
    if (/\b(lock|hammer|confident|strong)\b/.test(lowerContent)) return 'high';
    if (/\b(lean|slight|maybe)\b/.test(lowerContent)) return 'low';
    return 'medium';
  }

  categorizeTweet(content) {
    const categories = [];
    const lowerContent = content.toLowerCase();
    
    if (/\b(pick|play|bet)\b/.test(lowerContent)) categories.push('betting_pick');
    if (/\b(injury|hurt|out)\b/.test(lowerContent)) categories.push('injury_update');
    if (/\b(weather|rain|wind)\b/.test(lowerContent)) categories.push('weather_impact');
    if (/\b(line|moved|movement)\b/.test(lowerContent)) categories.push('line_movement');
    if (/\b(value|edge)\b/.test(lowerContent)) categories.push('value_bet');
    if (/\b(fade|public)\b/.test(lowerContent)) categories.push('fade_public');
    if (/\b(model|algorithm|data)\b/.test(lowerContent)) categories.push('model_analysis');
    if (/\b(breaking|news|report)\b/.test(lowerContent)) categories.push('breaking_news');
    
    if (categories.length === 0) categories.push('game_preview');
    
    return categories;
  }

  async findRelatedGames(content) {
    // Find games mentioned in the tweet
    const games = await Game.find({
      gameTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      status: { $ne: 'completed' }
    });

    const relatedGames = [];
    
    for (const game of games) {
      const teams = [
        game.homeTeam.name,
        game.awayTeam.name,
        game.homeTeam.abbreviation,
        game.awayTeam.abbreviation
      ];
      
      let matchCount = 0;
      teams.forEach(team => {
        if (content.toLowerCase().includes(team.toLowerCase())) {
          matchCount++;
        }
      });
      
      if (matchCount > 0) {
        relatedGames.push({
          gameId: game._id,
          teams: teams.filter(team => 
            content.toLowerCase().includes(team.toLowerCase())
          ),
          confidence: matchCount / teams.length
        });
      }
    }
    
    return relatedGames;
  }

  identifyExpert(handle) {
    return this.experts.find(expert => 
      expert.handle.toLowerCase() === handle.toLowerCase()
    );
  }

  calculateCredibilityScore(expert) {
    // Simple credibility scoring
    let score = 50; // Base score
    if (expert.verified) score += 20;
    if (expert.name.includes('Sports')) score += 10;
    return Math.min(100, score);
  }

  getEstimatedFollowers(handle) {
    // Placeholder - in production, you'd fetch real follower counts
    const estimates = {
      'BradPowers': 50000,
      'BarrettSallee': 75000,
      'TomFornelli': 100000,
      'ChrisFallica': 150000,
      'CollinWilson': 80000,
      'ToddFuhrman': 200000,
      'DocsSports': 120000
    };
    return estimates[handle] || 25000;
  }

  generateTweetId(handle, content, timestamp) {
    return `${handle}_${Date.parse(timestamp)}_${content.substring(0, 10).replace(/\W/g, '')}`;
  }

  parseNumber(text) {
    if (!text) return 0;
    const cleanText = text.replace(/[^\d\.k]/gi, '');
    const num = parseFloat(cleanText);
    if (cleanText.includes('k') || cleanText.includes('K')) {
      return Math.round(num * 1000);
    }
    return Math.round(num) || 0;
  }

  processTweetFromSearch($, element) {
    // Process tweets found in search results
    // This is a placeholder for more complex processing
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const twitterService = new TwitterService();

module.exports = {
  scrapeTwitterInsights: () => twitterService.scrapeTwitterInsights()
};