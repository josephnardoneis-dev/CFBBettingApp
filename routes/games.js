const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const Odds = require('../models/Odds');

// Get all games for today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const games = await Game.find({
      gameTime: { $gte: today, $lt: tomorrow },
      status: { $ne: 'completed' }
    }).sort({ gameTime: 1 });
    
    // Get odds for each game
    const gamesWithOdds = await Promise.all(
      games.map(async (game) => {
        const odds = await Odds.find({ gameId: game._id })
          .sort({ lastUpdated: -1 });
        
        return {
          ...game.toObject(),
          odds: odds
        };
      })
    );
    
    res.json(gamesWithOdds);
  } catch (error) {
    console.error('Error fetching today\'s games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get games for specific date
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const games = await Game.find({
      gameTime: { $gte: date, $lt: nextDay }
    }).sort({ gameTime: 1 });
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching games by date:', error);
    res.status(500).json({ error: 'Invalid date format' });
  }
});

// Get games for specific week
router.get('/week/:week/:season', async (req, res) => {
  try {
    const { week, season } = req.params;
    
    const games = await Game.find({
      week: parseInt(week),
      season: parseInt(season)
    }).sort({ gameTime: 1 });
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching games by week:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single game details
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Get all odds for this game
    const odds = await Odds.find({ gameId: game._id })
      .sort({ sportsbook: 1, lastUpdated: -1 });
    
    // Get expert insights for this game
    const ExpertInsight = require('../models/ExpertInsight');
    const insights = await ExpertInsight.find({
      'relatedGames.gameId': game._id
    })
    .sort({ timestamp: -1 })
    .limit(20);
    
    res.json({
      game: game,
      odds: odds,
      insights: insights
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming games (next 7 days)
router.get('/upcoming/week', async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const games = await Game.find({
      gameTime: { $gte: now, $lte: nextWeek },
      status: { $ne: 'completed' }
    })
    .sort({ gameTime: 1 })
    .limit(50);
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching upcoming games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search games by team
router.get('/team/:teamName', async (req, res) => {
  try {
    const teamName = req.params.teamName;
    const regex = new RegExp(teamName, 'i');
    
    const games = await Game.find({
      $or: [
        { 'homeTeam.name': { $regex: regex } },
        { 'awayTeam.name': { $regex: regex } },
        { 'homeTeam.abbreviation': { $regex: regex } },
        { 'awayTeam.abbreviation': { $regex: regex } }
      ]
    })
    .sort({ gameTime: -1 })
    .limit(20);
    
    res.json(games);
  } catch (error) {
    console.error('Error searching games by team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;