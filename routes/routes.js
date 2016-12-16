var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	var message = req.session.message;
	delete req.session.message;
	res.render('index', {message: message});
});

/* POST game page. */
router.post('/game', function(req, res, next) {
	var game = req.body.game;
	if (req.app.locals.games[game] >= 2) {
		res.redirect('/lobby');
	} else {
		res.render('game', {
			name: req.session.name,
			game: game
		});
	}
});

/* POST lobby page. */
router.post('/lobby', function (req, res, next) {
	if (req.app.locals.users.indexOf(req.body.name) > -1) {
		req.session.message = 'Error: name already taken. Please choose another.';
		res.redirect('/');
	} else {
		req.session.name = req.body.name;
		req.app.locals.users.push(req.body.name);
		res.render('lobby', {
			name: req.body.name,
			games: JSON.stringify(req.app.locals.games)
		});
	}
	
});

module.exports = router;
