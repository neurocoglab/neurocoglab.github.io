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
    
    console.log(color);

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

    // if units are meters then 0.01 here makes size
    // of the label into centimeters.
    label.scale.x = canvas.width * scale;
    label.scale.y = canvas.height * scale;
    
    console.log(label);

    return label;
    
}