var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/routes');

var app = express();
var port = process.env.PORT || 3000;

app.set('port', port);

var http = require('http').Server(app);
var io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'shipbattle',
	resave: false,
	saveUninitialized: true
}));

app.locals.games = {};


app.use('/', routes);

// catch 404 and forward to error handler
app.use( function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use( function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

io.on('connection', function (socket) {
	socket.on('join_game', function (game, name) {
		socket.join(game);
		socket.game = game;
		if (app.locals.games.hasOwnProperty(game)) {
			app.locals.games[game]++;
			io.to(game).emit('game_joined', name);
		} else {
			app.locals.games[game] = 1;
		}
		
		io.sockets.emit('update_games', app.locals.games);
	});
	
	socket.on('start_game', function (game) {
		socket.broadcast.to(game).emit('game_state', 'init');
	});
	
	socket.on('deploy', function (game) {
		socket.broadcast.to(game).emit('game_state', 'deploy');
	});
	
	socket.on('deployed', function (game) {
		socket.broadcast.to(game).emit('ready');
	});
	
	socket.on('engage', function (game) {
		io.to(game).emit('game_state', 'engage');
	});
	
	socket.on('fire', function (game, cell) {
		socket.broadcast.to(game).emit('fired', cell);
	});
	
	socket.on('hit', function (game, cell) {
		socket.broadcast.to(game).emit('was_hit', cell);
	});
	
	socket.on('miss', function (game, cell) {
		socket.broadcast.to(game).emit('missed', cell);
	});
	
	socket.on('sink', function (game, type) {
		socket.broadcast.to(game).emit('sunk', type);
	});
	
	socket.on('game_over', function (game) {
		socket.broadcast.to(game).emit('game_state', 'win');
		socket.emit('game_state', 'lose');
	});
	
	socket.on('disconnect', function () {
		delete app.locals.games[socket.game];
	});
	
});

//Start server
http.listen(port, function(){
	console.log('Express game server listening on port', port);
});

module.exports = app;

