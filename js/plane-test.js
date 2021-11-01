import * as THREE from './lib/three.js-master/build/three.module.js';
import { TrackballControls } from './lib/three.js-master/examples/jsm/controls/TrackballControls.js';
import * as UTILS from './utils-3d.js';

let camera, scene, renderer, view_dist;
let group, controls;
let vertices, centroid, betas, resid_segments, resid_geom;
let model_plane, model_plane_geom, model_plane_mesh, model_plane_border;

// Load data from CSV
    Papa.parse("resources/mlr_3vars.csv", {
									header: true,
									dynamicTyping: true,
									download: true,
									complete: function( results ) {
    
        vertices = [];
        centroid = new THREE.Vector3(0,0,0);
        
        //console.log(results.data);
    
        for (let i = 0; i < results.data.length; i++){
		    var item = results.data[i];
		    vertices.push(item['X1'], item['X2'], item['Y']);
		    centroid.x += item['X1'];
		    centroid.y += item['X2'];
		    centroid.z += item['Y'];
		    }

        centroid.multiplyScalar(3/results.data.length);

        init();
        requestAnimationFrame(animate);
        
//         animate();
        
     } } );

function init() {

    //window.addEventListener( 'resize', onWindowResize, false );

    var width = window.innerWidth;
    var height = window.innerHeight;
    
    view_dist = 2;
    
    // camera = new THREE.OrthographicCamera( width / - 1000, width / 1000, 
//                                            height / 1000, height / - 1000, 
//                                            -1, 10);
	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.set(0, 0, view_dist);
	camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0);

	scene = new THREE.Scene();
	
	scene.background = new THREE.Color( 0xffffff );

    // Planes
    const plane_xz = new THREE.GridHelper( 2, 2, 0xa30000, 0xa30000); // red
	const plane_xy = new THREE.GridHelper( 2, 2, 0x090f82, 0x090f82); // blue
	const plane_yz = new THREE.GridHelper( 2, 2, 0x0e6e05, 0x0e6e05); // green

	plane_xz.rotateX(Math.PI / 2);
	plane_yz.rotateZ(Math.PI / 2);
	
	var group = new THREE.Group();
	group.add( plane_xy );
	group.add( plane_xz );
	group.add( plane_yz );
	
// 	const text_canvas = document.createElement( 'canvas' );
	const label_font = '24px arial';
// 	console.log(THREE.FontUtils.faces);
	
	group.add( UTILS.create_label_billboard( 'X1-X2', [1.1,1.1,0], 
	                                         200, 50, 0.005, label_font,
	                                         0xa30000) );
	group.add( UTILS.create_label_billboard( 'X1-Y', [1.1,0,1.1], 
	                                         200, 50, 0.005, label_font,
	                                         0x090f82) );
	group.add( UTILS.create_label_billboard( 'X2-Y', [0,1.1,1.1], 
	                                         200, 50, 0.005, label_font,
	                                         0x0e6e05) );                                         

    scene.add( group );
    
    // Linear model
    betas = [centroid.z, 0, 0];

    // Model plane
    update_model_plane();
    
    // TODO: add clipping planes
    

    scene.add( model_plane_mesh );
    scene.add( model_plane_border );
    
    // Points
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
    //console.log(geometry);
   
    var sprite = new THREE.TextureLoader().load( 'js/lib/three.js-master/examples/textures/sprites/circle.png' );
   
    var material = new THREE.PointsMaterial( { color: 0xff9c38, size: .1, map: sprite,
                                                 alphaTest: 0.7, transparent: true,
                                                 sizeAttenuation: true } );
    
    var points = new THREE.Points( geometry, material );
    
    scene.add( points );
    
    // Residual lines
    var lines = get_residuals( vertices );
    //console.log(lines);
    resid_geom = new THREE.BufferGeometry().setFromPoints( lines );
    material = new THREE.LineBasicMaterial( { color: 0x000000, side: THREE.DoubleSide } );
                                                 
    resid_segments = new THREE.LineSegments( resid_geom, material );

    scene.add( resid_segments );            
    
    var parent = $("#renderer");
    width = parent.innerWidth();
    
	renderer = new THREE.WebGLRenderer( { antialias: true } );
// 	renderer.setSize(width, 0.7*width);
	
	parent.append(renderer.domElement);
	
// 	document.body.appendChild( renderer.domElement );
	
	renderer.render( scene, camera );
	
	createControls( camera );
	
	setupKeyLogger();
	
	update_info_bar();
	

}

function update_model_plane( update_mesh ) {

    model_plane = get_model_plane ();
    
    if (typeof model_plane_geom !== 'undefined'){
        model_plane_geom.dispose();
        }
        
    model_plane_geom = get_plane_geom( model_plane, 2.1, 2.1 );
    
    if (typeof model_plane_mesh !== 'undefined'){
        model_plane_mesh.geometry = model_plane_geom;
        model_plane_border.geometry = new THREE.EdgesGeometry( model_plane_geom );
        
        var lines = get_residuals( vertices );
        resid_geom.dispose();
        resid_geom = new THREE.BufferGeometry().setFromPoints( lines );
        
        resid_segments.geometry = resid_geom;
    } else {
        var material = new THREE.MeshBasicMaterial( {color: 0xfff945, side: THREE.DoubleSide,
                                                     transparent: true, opacity: 0.7,
                                                     depthWrite: false} );
                                              
        model_plane_mesh = new THREE.Mesh( model_plane_geom, material );
        model_plane_border = new THREE.LineSegments( new THREE.EdgesGeometry( model_plane_geom ), 
                                                     new THREE.LineBasicMaterial( { color: 0x000000 } ) );
        }
}

function get_model_plane ( ) {

    // Get normal + distance from betas
    var denom = Math.sqrt(betas[1]*betas[1] + betas[2]*betas[2] + 1);
    var nx = betas[1] / denom;
    var ny = betas[2] / denom;
    var nz = -1 / denom;
    var normal = new THREE.Vector3(nx, ny, nz);
    var p = betas[0] / denom;
    
    return new THREE.Plane( normal, p );
    

}

function get_plane_geom ( plane, width, height ) {

    var plane_geom = new THREE.PlaneGeometry( width, height );
    
    // Align the geometry to the plane
    var coplanarPoint = new THREE.Vector3(); 
    plane.coplanarPoint( coplanarPoint );
    var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(plane.normal);
    plane_geom.lookAt(focalPoint);
    plane_geom.translate(coplanarPoint.x, coplanarPoint.y, coplanarPoint.z);

    return plane_geom;

}

let mean_squared_error = 0;
let r_squared = 0;

function get_residuals( vertices ) {

    // Project each point to the model plane alone z-axis
    var offset = model_plane.normal.clone();
    offset.normalize();
    
    var resids = [];
    
    var pt1 = new THREE.Vector3();
    var pt2 = new THREE.Vector3();
    var pv_pos = new THREE.Vector3(0, 0, 10);
    var pv_neg = new THREE.Vector3(0, 0, -10);
    var test = new THREE.Line3();
    var pt_int = new THREE.Vector3();
    mean_squared_error = 0;
    var mean_squared_model_error = 0;
    for ( let i = 0; i < vertices.length-3; i += 3 ) {
        pt1 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2 = new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]);
        pt2.add(pv_pos);
        test.set(pt1, pt2);
        pt_int = new THREE.Vector3();
        if (model_plane.intersectLine(test, pt_int) != null) {
            resids.push(pt1, pt_int);
            mean_squared_error += pt1.distanceToSquared(pt_int);
            mean_squared_model_error += pt1.z*pt1.z;
        }else {
            pt2.set(vertices[i], vertices[i+1], vertices[i+2]);
            pt2.add(pv_neg);
            test.set(pt1, pt2);
            if (model_plane.intersectLine(test, pt_int) != null) {
                resids.push(pt1, pt_int);
                mean_squared_error += pt1.distanceToSquared(pt_int);
                mean_squared_model_error += pt1.z*pt1.z;
                }
            }
        }
        
    mean_squared_error /= resids.length;
    mean_squared_model_error /= resids.length;
    r_squared = 1 - (mean_squared_error / mean_squared_model_error);
    
    return resids;

}


function resizeCanvasToDisplaySize() {

  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  
  if (canvas.width !== width ||canvas.height !== height) {
    // you must pass false here or three.js sadly fights the browser
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // set render target sizes here
  }
}

function setupKeyLogger() {

    document.onkeydown = function(e) {
        
        handle_event( e.key );
        
    }
}

function handle_event( event ) {

    switch ( event ) {
        
        case 't':
        case 'T':
            camera.position.set(0, 0, view_dist);
            camera.lookAt(0, 0, 0);
            camera.up.set(0, 1, 0);
            return;
            
        case 'x':
        case 'X':
            camera.position.set(view_dist, 0, 0);
            camera.lookAt(0, 0, 0);
            camera.up.set(0, 0, 1);
            return;
            
        case 'y':
        case 'Y':
            camera.position.set(0, view_dist, 0);
            camera.lookAt(0, 0, 0);
            camera.up.set(0, 0, 1);
            return;
            
        case 'ArrowUp':
            betas[1] += .1;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowDown':
            betas[1] -= .1;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowLeft':
            betas[2] += .1;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowRight':
            betas[2] -= .1;
            update_model_plane();
            update_info_bar();
            return;
            
        default:
            console.log(e);

    }

}



function createControls( camera ) {

    controls = new TrackballControls( camera, renderer.domElement );
    
    controls.addEventListener( 'change', render );

    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];

}

function render() {

    renderer.render( scene, camera );

}

function animate( time ) {

    time *= 0.001; 

    resizeCanvasToDisplaySize();

    requestAnimationFrame( animate );

    controls.update();

//     stats.update();

    render();

}

function animation( time ) {

	group.rotation.x = time / 2000;
	group.rotation.y = time / 1000;

	renderer.render( scene, camera );

}

$(function() {

    // Set up sliders
    $( "#slider_beta1" ).slider({
      min: -2,
      max: 2,
      step: .1,
      value: 0.0,
      orientation: "horizontal",
      range: false,
      animate: true,
      slide: function( event, ui ) {
        
        betas[1] = ui.value;
        update_model_plane();
        update_info_bar();
        }
    });
    
     $( "#slider_beta2" ).slider({
      min: -2,
      max: 2,
      step: .1,
      value: 0.0,
      orientation: "horizontal",
      range: false,
      animate: true,
      slide: function( event, ui ) {
        
        betas[2] = ui.value;
        update_model_plane();
        update_info_bar();
        }
    });
    
    $( "#button_view_X1" ).button();
    $( "#button_view_X1" ).click( function( event ){
            event.preventDefault();
            handle_event('y');
            }
    );
    
    $( "#button_view_X2" ).button();
    $( "#button_view_X2" ).click( function( event ){
            event.preventDefault();
            handle_event('x');
            }
    );
    
    $( "#button_view_top" ).button();
    $( "#button_view_top" ).click( function( event ){
            event.preventDefault();
            handle_event('t');
            }
    );

});


function update_info_bar() {

    // Plane equation
    var eqn = '<span class="eqn-var">y&#770;</span> = <span class="eqn-val">' + 
              betas[1].toFixed(1) + '</span><span class="eqn-var">x<sub>1</sub></span> + ' + 
              '<span class="eqn-val">' + betas[2].toFixed(1) + 
              '</span><span class="eqn-var">x<sub>2</sub></span>';

    $('#info-equation').html(eqn);
    
    // Mean squared error
    $('#info-mse').html('MSE: <span class="eqn-val">' + mean_squared_error.toFixed(4) +
                        '</span>');
                        
    // Mean squared error
    $('#info-rsquared').html('R<sup>2</sup>: <span class="eqn-val">' + r_squared.toFixed(4) +
                        '</span>');                    

}
		
		
