import * as THREE from './lib/three.js-master/build/three.module.js';

function make_label_canvas(text, width, height, font, color) {
    
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = font;
    
    // measure how long the name will be
    const text_width = ctx.measureText(text).width;

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // scale to fit but don't stretch
    const scale_factor = Math.min(1, width / text_width);
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale_factor, 1);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    
    return ctx.canvas;
}

export function create_label_billboard( text, pos, width, height, scale, font, color ) {

    color = "#" + color.toString(16).padStart(6, '0');

    const canvas = make_label_canvas(text, width, height, font, color);
    const texture = new THREE.CanvasTexture(canvas);
    
    // because our canvas is likely not a power of 2
    // in both dimensions set the filtering appropriately.
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const label_material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    const label = new THREE.Sprite(label_material);
    
    label.position.x = pos[0];
    label.position.y = pos[1];
    label.position.z = pos[2];

    label.scale.x = canvas.width * scale;
    label.scale.y = canvas.height * scale;
    
    return label;
    
}

export function get_model_plane ( betas ) {

    // Get normal + distance from betas
    var denom = Math.sqrt(betas[1]*betas[1] + betas[2]*betas[2] + 1);
    var nx = betas[1] / denom;
    var ny = betas[2] / denom;
    var nz = -1 / denom;
    var normal = new THREE.Vector3(nx, ny, nz);
    var p = betas[0] / denom;
    
    return new THREE.Plane( normal, p );
    

}

export function get_residuals( vertices, plane ) {

    // Project each point to the model plane alone z-axis
    var offset = plane.normal.clone();
    offset.normalize();
    
    var resids = [];
    
    var pt1 = new THREE.Vector3();
    var pt2 = new THREE.Vector3();
    var pv_pos = new THREE.Vector3(0, 0, 10);
    var pv_neg = new THREE.Vector3(0, 0, -10);
    var test = new THREE.Line3();
    var pt_int = new THREE.Vector3();
    var mean_squared_error = 0;
    var mean_squared_model_error = 0;
    var mean_squared_total_error = 0;
    for ( let i = 0; i < vertices.length-3; i += 3 ) {
        pt1 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2.add(pv_pos);
        test.set(pt1, pt2);
        pt_int = new THREE.Vector3();
        if (plane.intersectLine(test, pt_int) != null) {
            resids.push(pt1, pt_int);
            mean_squared_error += pt1.distanceToSquared(pt_int);
            //mean_squared_total_error += pt1.z*pt1.z;
            mean_squared_model_error += pt_int.z*pt_int.z;
        }else {
            pt2.set(vertices[i], vertices[i+1], vertices[i+2]);
            pt2.add(pv_neg);
            test.set(pt1, pt2);
            if (plane.intersectLine(test, pt_int) != null) {
                resids.push(pt1, pt_int);
                mean_squared_error += pt1.distanceToSquared(pt_int);
                //mean_squared_total_error += pt1.z*pt1.z;
                mean_squared_model_error += pt_int.z*pt_int.z;
                }
            }
        }
        
    mean_squared_total_error = mean_squared_error + mean_squared_model_error;
    mean_squared_error /= resids.length;
    mean_squared_model_error /= resids.length;
    mean_squared_total_error /= resids.length;
    
//     var r_squared = 1 - (mean_squared_error / mean_squared_model_error);
    // Better definition
    var r_squared = mean_squared_model_error / mean_squared_total_error;
    //console.log(mean_squared_error, mean_squared_model_error, mean_squared_total_error);
     
    return [resids, mean_squared_error, r_squared];

}

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
		var xm =  (n-1) * (x-cmap['min']) / (cmap['max']-cmap['min']);
		i = Math.floor( xm );
		//console.log(n, i, xm, x);
		return interpolate_rgba(cmap['map'][i], cmap['map'][i+1], xm-i);
		}
		
	return cmap['map'][i];
}

function interpolate_rgba(clr1, clr2, pos) {

	var rgba = [];
	for (var i = 0; i < 4; i++){
		rgba.push(Math.round(clr1[i] + (clr2[i]-clr1[i]) * pos));
		}
	return rgba;

}

// Constructs an empty image of the specified
// dimensions and returns a URL to it, which
// can be set on an "img" object
export function get_image_url(data, cmap){

// 	console.log(cmap);
	var width = data.length;
	var height = data[0].length;
	var buffer = new Uint8ClampedArray(width * height * 4);
	
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

	// create an offscreen canvas
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

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

export function get_cbar_url( cmap, width, height ){

    var buffer = new Uint8ClampedArray(width * height * 4);
    
    for (var x = 0; x < width; x++) {
        var valx = cmap['min'] + (cmap['max'] - cmap['min']) * x / width;
        //console.log(valx);
        var rgba = getMappedColour(valx, cmap);
        //console.log(rgba);
        
        for (var y = 0; y < height; y++) {
            var pos = (y * width + x) * 4;
            buffer[pos  ] = rgba[0];  // Red
            buffer[pos+1] = rgba[1];  // Green
            buffer[pos+2] = rgba[2];  // Blue
            buffer[pos+3] = rgba[3];  // Alpha
            }
        }
        
    // create an offscreen canvas
	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	// size the canvas to dimensions
	canvas.width = width;
	canvas.height = height;

	// get the imageData and pixel array from the canvas
	var img_data = ctx.getImageData(0, 0, width, height);
	img_data.data.set(buffer);


	// put the modified pixels back on the canvas
	ctx.putImageData(img_data,0,0);

    //console.log(canvas);

	// Return a URL for this image
	return canvas.toDataURL();


}


export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Create n-dimensional array
export function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

// Rounds val to the nearest interval
export function round_to( val, interval ) {

    return Math.round(val / interval) * interval;

}