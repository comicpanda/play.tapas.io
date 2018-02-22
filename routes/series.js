const express = require('express');
const router = express.Router();
const DB = require('../db');

router.get('/:slug', function(req, res, next) {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').find({slug}).toArray(function(err, series) {
      if (err) {
        return next(err);
      }
      const aSeries = series[0];
      const episodes = [
        {id: 1, thumb: 'https://d30womf5coomej.cloudfront.net/sa/d7/7c63ed6f-a712-4818-8a0e-8e19e47ad184.png', title: 'Abc', no: 1},
        {id: 2, thumb: 'https://d30womf5coomej.cloudfront.net/sa/f0/30468871-7f87-4ae2-a911-62cc88be2bc4.png', title: 'Title', no: 2},
        {id: 3, thumb: 'https://d30womf5coomej.cloudfront.net/sa/f1/30034269-524b-45d0-be84-4237afff5695.png', title: 'Defg', no: 3},
        {id: 4, thumb: 'https://d30womf5coomej.cloudfront.net/sa/d0/301a9ad5-3acf-4e42-b5a3-168623275773.png', title: 'high', no: 4},
        {id: 5, thumb: 'https://d30womf5coomej.cloudfront.net/sa/3f/8b84aa4f-6a34-40e0-ba9a-378a9a4b0878.png', title: 'hell', no: 5},
      ];
      res.render('series', { episodes, aSeries });
    });
  });
});

router.get('/:slug/ep/:no', function(req, res, next) {
  const slug = req.params.slug;
  DB.q(next, db => {
    db.collection('series').find({slug}).toArray(function(err, series) {
      if (err) {
        return next(err);
      }
      const aSeries = series[0];
      const episodes = [
        {id: 1, thumb: 'https://d30womf5coomej.cloudfront.net/sa/d7/7c63ed6f-a712-4818-8a0e-8e19e47ad184.png', title: 'Abc', no: 1},
        {id: 2, thumb: 'https://d30womf5coomej.cloudfront.net/sa/f0/30468871-7f87-4ae2-a911-62cc88be2bc4.png', title: 'Title', no: 2},
        {id: 3, thumb: 'https://d30womf5coomej.cloudfront.net/sa/f1/30034269-524b-45d0-be84-4237afff5695.png', title: 'Defg', no: 3},
        {id: 4, thumb: 'https://d30womf5coomej.cloudfront.net/sa/d0/301a9ad5-3acf-4e42-b5a3-168623275773.png', title: 'high', no: 4},
        {id: 5, thumb: 'https://d30womf5coomej.cloudfront.net/sa/3f/8b84aa4f-6a34-40e0-ba9a-378a9a4b0878.png', title: 'hell', no: 5},
      ];
      res.render('series', { episodes, aSeries });
    });
  });
});

module.exports = router;
