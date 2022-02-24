import * as THREE from './lib/three.js-master/build/three.module.js';
import { TrackballControls } from './lib/three.js-master/examples/jsm/controls/TrackballControls.js';
import * as UTILS from './utils-3d.js';
import { CSS2DRenderer, CSS2DObject } from './lib/three.js-master/examples/jsm/renderers/CSS2DRenderer.js';


let camera, scene, renderer, label_renderer, view_dist;
let group, controls;
let vertices, centroid, betas, resid_segments, resid_geom;
let model_plane, model_plane_geom, model_plane_mesh, model_plane_border;
let mean_squared_error = 0, r_squared = 0;
let image_plot, image_url, cmap;

    // Load data from CSV
    Papa.parse("resources/mlr_3vars.csv", {
									header: true,
									dynamicTyping: true,
									download: true,
									complete: function( results ) {
    
        vertices = [];
        centroid = new THREE.Vector3(0,0,0);

        for (let i = 0; i < results.data.length; i++){
		    var item = results.data[i];
		    vertices.push(item['X1'], item['X1'], item['Y']);
		    centroid.x += item['X1'];
		    centroid.y += item['X1'];
		    centroid.z += item['Y'];
		    }

        centroid.multiplyScalar(3/results.data.length);

        init();
        requestAnimationFrame(animate);
        
        // Load gamma curves
        Papa.parse("resources/brew_rdoryl_cmap.csv", {
                                    header: false,
                                    dynamicTyping: true,
                                    download: true,
                                    complete: function( results ) {
            //console.log("All done!");
            //console.log("Read ", results.data.length, " records.");

            //console.log(results);
        
            // Add alpha channel
            for (var i = 0; i < results.data.length; i++){
                results.data[i].push(255);
                }
        
            cmap = {};
            cmap['map'] = results.data;
            cmap['min'] = 0.01;
            cmap['max'] = 0.2;
            
            //console.log(cmap);

            generate_image( cmap );
            
            }
    
         });

     } } );

function init() {

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
	
// 	const label_font = '24px arial';
	const label_font = '24px "M PLUS Rounded 1c"';
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
    scene.add( model_plane_mesh );
    scene.add( model_plane_border );
    
    // Points
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
    var sprite = new THREE.TextureLoader().load( 'js/lib/three.js-master/examples/textures/sprites/circle.png' );
   
    var material = new THREE.PointsMaterial( { color: 0xff9c38, size: .1, map: sprite,
                                                 alphaTest: 0.7, transparent: true,
                                                 sizeAttenuation: true } );
    
    var points = new THREE.Points( geometry, material );
    
    scene.add( points );
    
    // Residual lines
    var resids = UTILS.get_residuals( vertices, model_plane );
    var lines = resids[0];
    mean_squared_error = resids[1];
    r_squared = resids[2];
    resid_geom = new THREE.BufferGeometry().setFromPoints( lines );
    material = new THREE.LineBasicMaterial( { color: 0x000000, side: THREE.DoubleSide } );                                             
    resid_segments = new THREE.LineSegments( resid_geom, material );
    scene.add( resid_segments );            
    
    // Set up renderer
    var parent = $("#renderer");
    width = parent.innerWidth();   
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	parent.append(renderer.domElement);
	renderer.render( scene, camera );
	
	// Set up controls
	createControls( camera );
	setupKeyLogger();
	
	// Set up info bar
	update_info_bar();
	
}

function update_model_plane( update_mesh ) {

    model_plane = UTILS.get_model_plane ( betas );
    
    if (typeof model_plane_geom !== 'undefined'){
        model_plane_geom.dispose();
        }
        
    model_plane_geom = get_plane_geom( model_plane, 2.1, 2.1 );
    
    if (typeof model_plane_mesh !== 'undefined'){
        model_plane_mesh.geometry = model_plane_geom;
        model_plane_border.geometry = new THREE.EdgesGeometry( model_plane_geom );
        
        var resids = UTILS.get_residuals( vertices, model_plane );
        var lines = resids[0];
        mean_squared_error = resids[1];
        r_squared = resids[2];
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
            betas[1] += .05;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowDown':
            betas[1] -= .05;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowLeft':
            betas[2] += .05;
            update_model_plane();
            update_info_bar();
            return;
            
        case 'ArrowRight':
            betas[2] -= .05;
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
      min: -1,
      max: 1,
      step: .05,
      value: 0.0,
      orientation: "horizontal",
      range: false,
      animate: true,
      slide: function( event, ui ) {
        
        betas[1] = ui.value;
        update_model_plane();
        update_info_bar();
        update_image_crosshairs();
        },
      change: function( event, ui ) {
        betas[1] = ui.value;
        update_model_plane();
        update_info_bar();
        }
    });
    
     $( "#slider_beta2" ).slider({
      min: -1,
      max: 1,
      step: .05,
      value: 0.0,
      orientation: "horizontal",
      range: false,
      animate: true,
      slide: function( event, ui ) {
        betas[2] = ui.value;
        update_model_plane();
        update_info_bar();
        update_image_crosshairs();
        },
      change: function( event, ui ) {
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
              betas[1].toFixed(2) + '</span><span class="eqn-var">x<sub>1</sub></span> + ' + 
              '<span class="eqn-val">' + betas[2].toFixed(2) + 
              '</span><span class="eqn-var">x<sub>2</sub></span>';

    $('#info-equation').html(eqn);
    
    // Mean squared error
    $('#info-mse').html('MSE: <span class="eqn-val">' + mean_squared_error.toFixed(4) +
                        '</span>');
                        
    // Mean squared error
    $('#info-rsquared').html('R<sup>2</sup>: <span class="eqn-val">' + r_squared.toFixed(4) +
                        '</span>');                    

}

function get_mses( beta_min, beta_max, N_pix ) {

    var mses = UTILS.createArray(N_pix, N_pix);
    var itr = (beta_max - beta_min) / N_pix;
    
    var betas_ij = [0, 0, 0];
    for (var i = 0; i < N_pix; i++){
        betas_ij[1] = beta_min + i * itr;
        for (var j = 0; j < N_pix; j++){
		    betas_ij[2] = beta_min + j * itr;
		     
		    // Compute MSE for these betas
		    var plane_ij = UTILS.get_model_plane ( betas_ij );
		    var resids_ij = UTILS.get_residuals( vertices, plane_ij );
		    
		    mses[i][j] = resids_ij[1];
            }
        }
    
    return mses;

}
		
function generate_image( cmap ) {

    // Create image from data and betas
    var N_pix = 100;
    var beta_min = -1.5, beta_max = 1.5;
    var mses = get_mses( beta_min, beta_max, N_pix );
    
    image_url = UTILS.get_image_url( mses, cmap );
   
    var data = [[[image_url, beta_min, beta_min, beta_max, beta_max]]];

    var options = {
        series: {
            images: {
                show: true
            }
        },
        crosshair: {
            mode: "xy",
            color: "cyan"
			},
        grid: {
            hoverable: true,
            clickable: true,
            autoHighlight: false
            },
        xaxis: {
            autoScale: "none",
            min: beta_min,
            max: beta_max,
            axisLabel: "β1",
            showTickLabels: 'none', 
            showTicks: false,

        },
        yaxis: {
            autoScale: "none",
            min: beta_min,
            max: beta_max,
            axisLabel: "β2",
            showTickLabels: 'none', 
            showTicks: false

        }
    };

    $.plot.image.loadDataImages(data, options, function () {
        var placeholder = $("#placeholder-img");

        image_plot = $.plot(placeholder, data, options);
        
//         console.log(placeholder);
        
        placeholder.on("plotclick", function (event, pos, item) {
        
            // Get closest betas
            pos.x = UTILS.round_to(pos.x, 0.05);
            pos.y = UTILS.round_to(pos.y, 0.05);
            
            $( "#slider_beta1" ).slider('value', pos.x);
            $( "#slider_beta2" ).slider('value', pos.y);
            
		    image_plot.lockCrosshair(pos);
		    //console.log(pos);
		});
        
        update_image_crosshairs();
    });
    
    var cbar_url = UTILS.get_cbar_url( cmap, N_pix, 20 );
//     console.log(cbar_url);
    var cbar_data = [[[cbar_url, cmap['min'], 0, cmap['max'], 20]]];
    var cbar_options = {
        series: {
            images: {
                show: true
            }
        },
        yaxis: {
            autoScale: "none",
            min: 0,
            max: 20,
            axisLabel: "MSE",
            showTickLabels: 'none', 
            showTicks: false
        },
        xaxis: {
            font:{ size: 11 },
            min: cmap['min'],
            max: cmap['max'],
            showTicks: false,
            showTickLabels: 'endpoints',
            tickFormatter: function( number ) { return number.toFixed(2).substring(1); }
          
        }
    };
    
    $.plot.image.loadDataImages(cbar_data, cbar_options, function () {
        var placeholder = $("#placeholder-cbar");
        
        var wtf = $.plot(placeholder, cbar_data, cbar_options);
        
        }
    );
    
}

function update_image_crosshairs() {

    image_plot.lockCrosshair({x: betas[1], y: betas[2]});

}

function draw_current_mse() {

    var scale = 0.1;
    var ctx = image_plot.getCanvas().getContext("2d");
//     ctx.strokeStyle = '#000000';

    //console.log(betas);
    

    ctx.moveTo(betas[1]-scale/2, betas[2]);
    ctx.lineTo(betas[1]+scale/2, betas[2]);
    ctx.moveTo(betas[1], betas[2]-scale/2);
    ctx.lineTo(betas[1], betas[2]+scale/2);
    

}
