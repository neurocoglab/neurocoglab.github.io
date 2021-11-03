// Get colour from a colour map
// x is mapped between cmap['min'] and cmap['max']
// and the colour at the corresponding index
// of cmap['map'] is returned
function getMappedColour(x, cmap){

	var n = cmap['map'].length;
	var i;
	if (x <= cmap['min']){
		return cmap['map'][0];
	} else if (x >= cmap['max']){
		return cmap['map'][n-1];
	} else {
		xm =  (n-1) * (x-cmap['min']) / (cmap['max']-cmap['min']);
		i = Math.floor( xm );
		return interpolate_rgba(cmap['map'][i], cmap['map'][i+1], xm-i);
		}
		
	return cmap['map'][i];
}

function interpolate_rgba(clr1, clr2, pos) {

	rgba = [];
	for (i = 0; i < 4; i++){
		rgba.push(clr1[i] + (clr2[i]-clr1[i]) * pos);
		}
	return rgba;

}

// Constructs an empty image of the specified
// dimensions and returns a URL to it, which
// can be set on an "img" object
function getImgUrl(data, cmap){

// 	console.log(cmap);
	var width = data.length;
	var height = data[0].length;
	var buffer = new Uint8ClampedArray(width * height * 4);
	n = cmap['map'].length;
	
	//test = [];
	
	for(var y = 0; y < height; y++) {
		for(var x = 0; x < width; x++) {
			var pos = (y * width + x) * 4; // position in buffer based on x and y
			var rgba = getMappedColour(data[x][height-y-1], cmap);
			buffer[pos  ] = rgba[0];  // Red
			buffer[pos+1] = rgba[1];  // Green
			buffer[pos+2] = rgba[2];  // Blue
			buffer[pos+3] = rgba[3];  // Alpha
			
			}
		}
		
// 	console.log(width, height);

	// create an offscreen canvas
	var canvas=document.createElement("canvas");
	var ctx=canvas.getContext("2d");

	// size the canvas to dimensions
	canvas.width = width;
	canvas.height = height;

	// get the imageData and pixel array from the canvas
	var img_data = ctx.getImageData(0, 0, width, height);
	img_data.data.set(buffer);


	// put the modified pixels back on the canvas
	ctx.putImageData(img_data,0,0);

	// Return a URL for this image
	return canvas.toDataURL();

}

// Constructs an empty image of the specified
// dimensions and returns a URL to it, which
// can be set on an "img" object
function getImgUrlTstats(stats, alpha, cmap){

	var tvals = stats[0];
	var pvals = stats[1];

	var width = tvals.length;
	var height = tvals[0].length;
	var buffer = new Uint8ClampedArray(width * height * 4);
	n = cmap['map'].length;
	
	//test = [];
	
	for(var y = 0; y < height; y++) {
		for(var x = 0; x < width; x++) {
			var pos = (y * width + x) * 4; // position in buffer based on x and y
			var rgba = getMappedColour(tvals[x][height-y-1], cmap);
			var a = rgba[3];
			if (pvals[x][height-y-1] >= alpha) {
				a = Math.round(rgba[3]/2);
				}
			//if (x == 0){ test.push(a, pvals[x]); }
			buffer[pos  ] = rgba[0];  // Red
			buffer[pos+1] = rgba[1];  // Green
			buffer[pos+2] = rgba[2];  // Blue
			buffer[pos+3] = a;  // Alpha
			
			}
		}
		
	//console.log(test);

	// create an offscreen canvas
	var canvas=document.createElement("canvas");
	var ctx=canvas.getContext("2d");

	// size the canvas to dimensions
	canvas.width = width;
	canvas.height = height;

	// get the imageData and pixel array from the canvas
	var img_data = ctx.getImageData(0, 0, width, height);
	img_data.data.set(buffer);
	
	

	// put the modified pixels back on the canvas
	ctx.putImageData(img_data,0,0);

	// Return a URL for this image
	return canvas.toDataURL();

}

