var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* GET game page. */
router.get('/game', function(req, res, next) {
  res.render('game', { title: 'Battleship' });
});

/* GET users listing. */
router.get('/users', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET lobby page. */
router.post('/lobby', function (req, res, next) {
	res.render('lobby');
});

module.exports = router;
