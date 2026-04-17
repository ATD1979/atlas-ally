// Atlas Ally — News API Route
// Connects the enhanced news.js service to /api/news endpoint

const express = require('express');
const router = express.Router();
const newsService = require('../news');

// GET /api/news - Get news for a specific country
router.get('/news', async (req, res) => {
  try {
    await newsService.getNews(req, res);
  } catch (error) {
    console.error('News route error:', error);
    res.status(500).json({ 
      error: 'News service error',
      details: error.message,
      articles: []
    });
  }
});

module.exports = router;
