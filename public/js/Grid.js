var rows = 10;
var columns = 10;
var $row = $("<div />", {
    class: 'row'
});
var $square = $("<div />", {
    class: 'square'
});


$(document).ready(function () {
    //add columns to the the temp row object
    for (var i = 0; i < columns; i++) {
    	$cell = $square.clone();
    	$cell.attr('col', i);
        $row.append($cell);
    }
    //clone the temp row object with the columns to the wrapper
    for (var i = 0; i < rows; i++) {
    	$r = $row.clone();
    	$r.attr('row', i);
        $("#board").append($r);
    }
    
    $('.square').click(function () {
    	console.log($(this).parent().attr('row'));
    	console.log($(this).attr('col'));
    	$(this).css('background', '#FF0000');
    });
});