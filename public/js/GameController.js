var shipTypes = ['carrier', 'battleship', 'submarine', 'cruiser', 'patrolboat'];

var shipSize = {
  carrier	: 5,
  battleship: 4,
  submarine	: 4,
  cruiser	: 3,
  patrolboat: 2
};


function Ship (type) {
  this.type = type;
  this.cells = []; // Strings of format 'row-col'
  this.hits = [];
  this.dead = false;
}

function Player (name) {
	this.name = name;
	this.fleet = [];
	this.shots = [];
}

function GameController (rows, cols, socket, game, player) {
	this.rows = rows;
	this.cols = cols;
	this.socket = socket;
	this.game = game;
	this.player = new Player(player);
	this.state = 'init';
	this.orientation = 'horizontal';
	this.myTurn = false;
	this.enemyReady = false;
}

GameController.prototype.initialize = function () {
	var $row = $("<div />", {
	    class: 'row'
	});
	var $square = $("<div />", {
	    class: 'square'
	});
	
	var $labelRow = $row.clone();
	$labelRow.append($square.clone());
	for (var i = 1; i <= this.cols; i++) {
		var $colLabel = $square.clone();
		$colLabel.html(i);
		$labelRow.append($colLabel);
	}
	
	// Create enemy board
	$('#enemyBoard').append($labelRow.clone());
	
    for (var i = 1; i <= this.cols; i++) {
    	var $cell = $square.clone();
    	$cell.attr('col', i);
    	$cell.addClass('enemy-cell');
        $row.append($cell);
    }
    
    for (var i = 1; i <= this.rows; i++) {
    	var $r = $row.clone();
    	$r.attr('row', i);
    	var $label = $square.clone();
    	$label.html(String.fromCharCode(i+64));
    	$r.prepend($label);
        $('#enemyBoard').append($r);
    }
    
    // Create player board
    var $playerBoard = $('#enemyBoard').clone();
    $playerBoard.attr('id', 'playerBoard');
    var $cells = $playerBoard.find('.enemy-cell');
    $cells.removeClass('enemy-cell');
    $cells.addClass('player-cell');
    $('#playerBoard').replaceWith($playerBoard);
    
    
    // Set up board cell click listeners
    $('.enemy-cell').click(function () {
    	var $this = $(this);
    	var row = $this.parent().attr('row');
    	var col = $this.attr('col');
    });
    
    $('.player-cell').click(function () {
    	var $this = $(this);
    	var row = $this.parent().attr('row');
    	var col = $this.attr('col');
    });
    
    socket.emit('deploy', this.game);
};

GameController.prototype.deploy = function () {
	var controller = this;
	
	/* Set up click handlers for deploying ships */
	
	// Switch orientation on spacebar press
	$(document).keydown(function (e) {
		e.preventDefault();
		if (e.which === 32) {
			controller.orientation = controller.orientation === 'horizontal' ? 'vertical' : 'horizontal';
			$('.ghost').removeClass('ghost');
		}
	})
	
	// Highlight ship location on hover
	$('.player-cell').hover(
		function () {
			var $this = $(this);
			var row = parseInt($this.parent().attr('row'));
			var col = parseInt($this.attr('col'));
			var size = shipSize[shipTypes[controller.player.fleet.length]]; // Get size of next unplaced ship
			var $shipCells = getShipCells(row, col, size, controller.orientation);
			$shipCells.addClass('ghost');
		}, 
		function () {
			var $this = $(this);
			var row = parseInt($this.parent().attr('row'));
			var col = parseInt($this.attr('col'));
			var size = shipSize[shipTypes[controller.player.fleet.length]]; // Get size of next unplaced ship
			var $shipCells = getShipCells(row, col, size, controller.orientation);
			$shipCells.removeClass('ghost');
		}
	);
	
	// Place ship on click if it is in a legal position
	$('.player-cell').click(function () {
		var $this = $(this);
		var row = parseInt($this.parent().attr('row'));
		var col = parseInt($this.attr('col'));
		var size = shipSize[shipTypes[controller.player.fleet.length]]; // Get size of next unplaced ship
		var $shipCells = getShipCells(row, col, size, controller.orientation);
		var legalShip = true;
		var cells = [];
		$shipCells.each(function () {
			var thisRow = parseInt($(this).parent().attr('row'));
			var thisCol = parseInt($(this).attr('col'));
			cells.push(thisRow + '-' + thisCol);
			legalShip = legalShip && isOpenAndLegal(thisRow, thisCol, controller);
		})
		
		if (legalShip) {
			$shipCells.addClass('ship');
			var ship = new Ship(shipTypes[controller.player.fleet.length]);
			ship.cells = cells;
			controller.player.fleet.push(ship);
			
			// Check if all ships have been deployed
			if (controller.player.fleet.length === 5) {
				controller.socket.emit('deployed', controller.game);
				
				// Remove all click handlers
				$('.player-cell').off('click');
				$(document).off('keydown');
				
				if (controller.enemyReady) {
					controller.socket.emit('engage', controller.game);
				}
			}
		}
	});
};


GameController.prototype.engage = function () {
	var controller = this;
	
	// Set up click handlers
	$('.enemy-cell').click(function () {
		console.log('click');
		if (controller.myTurn) {
			console.log('my turn');
			var row = $(this).parent().attr('row');
			var col = $(this).attr('col');
			var cell = row + '-' + col;
			if (controller.player.shots.indexOf(cell) === -1) {
				controller.player.shots.push(cell);
				controller.socket.emit('fire', controller.game, cell);
				controller.myTurn = false;
			}
		}
	});
	
	// Highlight cell on hover
	$('.enemy-cell').hover(
		function () {
			$(this).addClass('highlight');
		},
		function () {
			$(this).removeClass('highlight');
		}
	);
};

GameController.prototype.checkHit = function (cell) {
	var fleet = this.player.fleet;
	for (var i = 0; i < fleet.length; i++) {
		if (fleet[i].cells.indexOf(cell) > -1) {
			// Make hit cell red
			var coords = cell.split('-');
			var row = coords[0];
			var col = coords[1];
			var $cell = $('.player-cell').filter(function () {
				var thisRow = $(this).parent().attr('row');
				var thisCol = $(this).attr('col');
				return row === thisRow && col === thisCol;
			});
			$cell.addClass('hit');
			
			// Record hit in fleet and check for sunk ships
			fleet[i].hits.push(cell);
			this.socket.emit('hit', this.game, cell);
			if(fleet[i].hits.length === fleet[i].cells.length) {
				fleet[i].dead = true;
				this.socket.emit('sink', this.game, fleet[i].type);
			}
			this.myTurn = true;
			return;
		}
	}
	
	// Make missed cell white
	var coords = cell.split('-');
	var row = coords[0];
	var col = coords[1];
	var $cell = $('.player-cell').filter(function () {
		var thisRow = $(this).parent().attr('row');
		var thisCol = $(this).attr('col');
		return row === thisRow && col === thisCol;
	});
	$cell.addClass('miss');
	
	this.socket.emit('miss', this.game, cell);
	this.myTurn = true;
}

GameController.prototype.enemyHit = function (cell) {
	var coords = cell.split('-');
	var row = coords[0];
	var col = coords[1];
	var $cell = $('.enemy-cell').filter(function () {
		var thisRow = $(this).parent().attr('row');
		var thisCol = $(this).attr('col');
		return row === thisRow && col === thisCol;
	});
	$cell.addClass('hit');
};

GameController.prototype.enemyMiss = function (cell) {
	var coords = cell.split('-');
	var row = coords[0];
	var col = coords[1];
	var $cell = $('.enemy-cell').filter(function () {
		var thisRow = $(this).parent().attr('row');
		var thisCol = $(this).attr('col');
		return row === thisRow && col === thisCol;
	});
	$cell.addClass('miss');
};

var getShipCells = function (startRow, startCol, size, orientation) {
	return $('.player-cell').filter(function () {
		// Get row and col as ints
    	var row = parseInt($(this).parent().attr('row'));
    	var col = parseInt($(this).attr('col'));
    	if (orientation === 'vertical') {
    		return row >= startRow && row < startRow + size && col === startCol;
    	} else { // orientation === 'horizontal'
    		return col >= startCol && col < startCol + size && row === startRow;
    	}
	});
}

var isOpenAndLegal = function (row, col, controller) {
	// Check for out of bounds
	if (row < 1 || row > controller.rows || col < 1 || col > controller.cols) {
		return false;
	}
	
	// Check for ship intersect
	var fleet = controller.player.fleet;
	for (var i = 0; i < fleet.length; i++) {
		if (fleet[i].cells.indexOf(row + '-' + col) > -1) {
			return false;
		}
	}
	
	return true;
}



