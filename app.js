var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/routes');

var app = express();
var port = process.env.PORT || 3000;

app.set('port', port);

var http = require('http').Server(app);
var io = require('socket.io')(http);
var games = [];

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
	console.log('a user connected');
	
	socket.on('joinlobby', function (name) {
		console.log('joinlobby');
		socket.name = name;
		socket.emit('joingame', 'Lobby');
	})
	
	socket.on('creategame', function (game) {
		console.log('creategame');
		games.push(game);
		socket.emit('joingame', game);
		socket.emit('updategames', games);
	});
	
	socket.on('joingame', function (game) {
		console.log('joingame');
		socket.leave(socket.game);
		socket.game = game;
		socket.join(game);
	})
	
	
	socket.on('disconnect', function () {
		console.log('disconnect');
		if (socket.game !== 'Lobby') {
			games.splice(games.indexOf(socket.game), 1);
		}
		console.log('user disconnected');
	});
});

//Start server
app.listen(app.get('port'), function () {
  console.log('Express game server listening on port ' + port);
});

module.exports = app;

