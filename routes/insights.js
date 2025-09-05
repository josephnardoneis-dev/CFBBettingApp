const express = require('express');
const router = express.Router();
const ExpertInsight = require('../models/ExpertInsight');

// Get latest expert insights
router.get('/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const insights = await ExpertInsight.find()
      .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching latest insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get insights for specific game
router.get('/game/:gameId', async (req, res) => {
  try {
    const insights = await ExpertInsight.find({
      'relatedGames.gameId': req.params.gameId
    })
    .sort({ timestamp: -1 })
    .limit(50);
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching game insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get insights by expert
router.get('/expert/:twitterHandle', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const insights = await ExpertInsight.find({
      twitterHandle: req.params.twitterHandle
    })
    .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
    .sort({ timestamp: -1 })
    .limit(limit);
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching expert insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get betting picks (insights that mention bets)
router.get('/picks', async (req, res) => {
  try {
    const category = req.query.category;
    const limit = parseInt(req.query.limit) || 50;
    
    let query = { 'bettingContext.mentionsBet': true };
    
    if (category) {
      query.categories = category;
    }
    
    const picks = await ExpertInsight.find(query)
      .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(picks);
  } catch (error) {
    console.error('Error fetching betting picks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get insights by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 30;
    
    const insights = await ExpertInsight.find({
      categories: category
    })
    .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
    .sort({ timestamp: -1 })
    .limit(limit);
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending insights (high engagement)
router.get('/trending', async (req, res) => {
  try {
    const hoursAgo = parseInt(req.query.hours) || 24;
    const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
    
    const insights = await ExpertInsight.find({
      timestamp: { $gte: cutoffTime }
    })
    .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
    .sort({
      likes: -1,
      retweets: -1,
      timestamp: -1
    })
    .limit(20);
    
    // Calculate engagement score
    const trendings = insights.map(insight => ({
      ...insight.toObject(),
      engagementScore: (insight.likes * 1) + (insight.retweets * 2) + (insight.replies * 0.5)
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore);
    
    res.json(trendings);
  } catch (error) {
    console.error('Error fetching trending insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expert rankings by accuracy
router.get('/experts/rankings', async (req, res) => {
  try {
    const experts = await ExpertInsight.aggregate([
      {
        $match: {
          'bettingContext.mentionsBet': true,
          'expertMetrics.recentAccuracy': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$twitterHandle',
          expertName: { $first: '$expertName' },
          totalPicks: { $sum: 1 },
          avgAccuracy: { $avg: '$expertMetrics.recentAccuracy' },
          credibilityScore: { $avg: '$expertMetrics.credibilityScore' },
          isVerified: { $first: '$expertMetrics.isVerified' },
          followerCount: { $avg: '$expertMetrics.followerCount' },
          specialties: { $first: '$expertMetrics.specialties' }
        }
      },
      {
        $sort: { avgAccuracy: -1, credibilityScore: -1 }
      },
      {
        $limit: 20
      }
    ]);
    
    res.json(experts);
  } catch (error) {
    console.error('Error fetching expert rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search insights by content
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const insights = await ExpertInsight.find({
      $text: { $search: q }
    })
    .populate('relatedGames.gameId', 'homeTeam awayTeam gameTime')
    .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
    .limit(parseInt(limit));
    
    res.json(insights);
  } catch (error) {
    console.error('Error searching insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;