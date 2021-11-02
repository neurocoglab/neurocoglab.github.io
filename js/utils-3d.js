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
    for ( let i = 0; i < vertices.length-3; i += 3 ) {
        pt1 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2.add(pv_pos);
        test.set(pt1, pt2);
        pt_int = new THREE.Vector3();
        if (plane.intersectLine(test, pt_int) != null) {
            resids.push(pt1, pt_int);
            mean_squared_error += pt1.distanceToSquared(pt_int);
            mean_squared_model_error += pt1.z*pt1.z;
        }else {
            pt2.set(vertices[i], vertices[i+1], vertices[i+2]);
            pt2.add(pv_neg);
            test.set(pt1, pt2);
            if (plane.intersectLine(test, pt_int) != null) {
                resids.push(pt1, pt_int);
                mean_squared_error += pt1.distanceToSquared(pt_int);
                mean_squared_model_error += pt1.z*pt1.z;
                }
            }
        }
        
    mean_squared_error /= resids.length;
    mean_squared_model_error /= resids.length;
    var r_squared = 1 - (mean_squared_error / mean_squared_model_error);
    
    return [resids, mean_squared_error, r_squared];

}