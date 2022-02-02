var a, b;
var range_x, range_y;
var plot;

$(document).ready(function() {

    init();

});

function init() {

    range_x = [-4,4];
    range_y = [-4,4];

    a = 0.1;
    b = 0;

    // Draw line
	var px1 = range_x[0];
	var px2 = range_x[1];
	var py1 = a*px1; 
	var py2 = a*px2;
    var values = [[px1, py1],
                  [px2, py2]];
                
              
    var data = [{ data: values, 
				  label: "Line", 
				  color: "#d12b2b", 
				  points: { show: false },
				  lines: { show: true, lineWidth: 2 } 
				  }];

	var options = {
			xaxes: [{ show: true,
					  position: 'bottom',
					  axisLabel: 'Variable X', 
					  min: range_x[0], 
					  max: range_x[1], 
					  autoScale: 'none' }],
			yaxes: [{ show: true, 
					  position: 'left',
					  axisLabel: 'Variable Y', 
					  min: range_y[0], 
					  max: range_y[1], 
					  autoScale: 'none' }],
		}; 			  
	
    var placeholder = $("#placeholder");
	plot = $.plot(placeholder, data, options);
	
	// Add line equation
    var eqn = 'y = <span class="slider_a">' + a.toFixed(1) + '</span>x + ' + 
              '<span class="slider_b">' + b.toFixed(1) + '</span>';
    placeholder.append("<div id='plot_equation'>" + eqn + "</div>");
    
}


$( function() {
    $( "#slider-scale-a" ).slider({
      orientation: "horizontal",
      range: "min",
      min: -1.5,
      max: 1.5,
      value: 0.1,
      step: 0.05,
      slide: function( event, ui ) {
        a = ui.value;
        update_line( );
        }

     });
});

$( function() {
    $( "#slider-scale-b" ).slider({
      orientation: "horizontal",
      range: "min",
      min: -2,
      max: 2,
      value: 0,
      step: 0.05,
      slide: function( event, ui ) {
        b = ui.value;
        update_line(  );
        }

     });
});

function update_line() {

    // Draw line
    var px1 = range_x[0];
    var px2 = range_x[1];
    var py1 = a*px1 + b; 
    var py2 = a*px2 + b;
    var values = [[px1, py1],
                  [px2, py2]];
                  
    var plot_data = plot.getData();

    for (var i = 0; i < plot_data.length; i++) {
        if (plot_data[i].label == "Line"){
            plot_data[i].data = values;
            console.log('Values changed');
            }
        }
    
    var eqn = 'y = <span class="slider_a">' + a.toFixed(1) + '</span>x' + 
              (b < 0 ? ' - ' : ' + ') +
              '<span class="slider_b">' + Math.abs(b).toFixed(1) + '</span>';
    //var eqn = "y = " + a.toFixed(1) + "x" + (b < 0 ? ' - ' : ' + ') + Math.abs(b).toFixed(1);
    $("#plot_equation").html(eqn);
    
    plot.setData(plot_data);
    plot.setupGrid();
    plot.draw();

}