const express = require('express');
const router = express.Router();
const Odds = require('../models/Odds');

// Get latest odds for a specific game
router.get('/game/:gameId', async (req, res) => {
  try {
    const odds = await Odds.find({ gameId: req.params.gameId })
      .sort({ sportsbook: 1, lastUpdated: -1 });
    
    // Group by sportsbook to get latest odds from each
    const oddsBySportsbook = {};
    odds.forEach(odd => {
      if (!oddsBySportsbook[odd.sportsbook] || 
          odd.lastUpdated > oddsBySportsbook[odd.sportsbook].lastUpdated) {
        oddsBySportsbook[odd.sportsbook] = odd;
      }
    });
    
    res.json(Object.values(oddsBySportsbook));
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get odds comparison across sportsbooks for specific market
router.get('/compare/:gameId/:market', async (req, res) => {
  try {
    const { gameId, market } = req.params;
    
    const odds = await Odds.find({ gameId })
      .sort({ lastUpdated: -1 });
    
    // Get latest odds from each sportsbook
    const latestOdds = {};
    odds.forEach(odd => {
      if (!latestOdds[odd.sportsbook] || 
          odd.lastUpdated > latestOdds[odd.sportsbook].lastUpdated) {
        latestOdds[odd.sportsbook] = odd;
      }
    });
    
    // Extract specific market data
    const comparison = Object.values(latestOdds).map(odd => ({
      sportsbook: odd.sportsbook,
      [market]: odd[market],
      lastUpdated: odd.lastUpdated
    }));
    
    res.json(comparison);
  } catch (error) {
    console.error('Error comparing odds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get best odds for a specific bet type
router.get('/best/:gameId/:betType/:selection', async (req, res) => {
  try {
    const { gameId, betType, selection } = req.params;
    
    const odds = await Odds.find({ gameId })
      .sort({ lastUpdated: -1 });
    
    let bestOdds = null;
    let bestValue = -Infinity;
    
    odds.forEach(odd => {
      let currentValue = -Infinity;
      
      switch(betType) {
        case 'spread':
          currentValue = selection === 'home' ? odd.spread?.homeOdds : odd.spread?.awayOdds;
          break;
        case 'moneyline':
          currentValue = selection === 'home' ? odd.moneyline?.home : odd.moneyline?.away;
          break;
        case 'total':
          currentValue = selection === 'over' ? odd.total?.over : odd.total?.under;
          break;
      }
      
      if (currentValue > bestValue) {
        bestValue = currentValue;
        bestOdds = {
          sportsbook: odd.sportsbook,
          odds: currentValue,
          lastUpdated: odd.lastUpdated
        };
      }
    });
    
    res.json(bestOdds);
  } catch (error) {
    console.error('Error finding best odds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get odds movement history
router.get('/history/:gameId/:sportsbook', async (req, res) => {
  try {
    const { gameId, sportsbook } = req.params;
    
    const oddsRecord = await Odds.findOne({ 
      gameId, 
      sportsbook 
    }).sort({ lastUpdated: -1 });
    
    if (!oddsRecord) {
      return res.status(404).json({ error: 'Odds not found' });
    }
    
    res.json({
      sportsbook: oddsRecord.sportsbook,
      history: oddsRecord.oddsHistory,
      current: {
        spread: oddsRecord.spread,
        total: oddsRecord.total,
        moneyline: oddsRecord.moneyline
      }
    });
  } catch (error) {
    console.error('Error fetching odds history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all player props for a game
router.get('/props/players/:gameId', async (req, res) => {
  try {
    const odds = await Odds.find({ 
      gameId: req.params.gameId,
      'playerProps.0': { $exists: true }
    })
    .sort({ sportsbook: 1, lastUpdated: -1 });
    
    // Aggregate all player props
    const allProps = [];
    odds.forEach(odd => {
      odd.playerProps.forEach(prop => {
        allProps.push({
          ...prop.toObject(),
          sportsbook: odd.sportsbook,
          lastUpdated: odd.lastUpdated
        });
      });
    });
    
    // Group by player and market
    const groupedProps = {};
    allProps.forEach(prop => {
      const key = `${prop.playerName}_${prop.market}`;
      if (!groupedProps[key]) {
        groupedProps[key] = [];
      }
      groupedProps[key].push(prop);
    });
    
    res.json(groupedProps);
  } catch (error) {
    console.error('Error fetching player props:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get line movements for today's games
router.get('/movements/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const Game = require('../models/Game');
    const todayGames = await Game.find({
      gameTime: { $gte: today, $lt: tomorrow }
    }).select('_id');
    
    const gameIds = todayGames.map(game => game._id);
    
    const movements = await Odds.find({
      gameId: { $in: gameIds },
      $or: [
        { 'spread.lastMovement': { $ne: 'none' } },
        { 'total.lastMovement': { $ne: 'none' } }
      ]
    })
    .populate('gameId', 'homeTeam awayTeam gameTime')
    .sort({ lastUpdated: -1 });
    
    res.json(movements);
  } catch (error) {
    console.error('Error fetching line movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;