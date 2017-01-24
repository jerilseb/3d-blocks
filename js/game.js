
// global variables
var renderer;
var scene;
var camera;
var controls;


var board_size = 5;
var BOARD_SIZE = 5;
var FIGURE_TEXTURE_IMG = 'img/wood.png';
var FIGURE_TEXTURE2_IMG = 'img/wood2.jpg';
var PLACE_TEXTURE_IMG = [
  'img/marble2.jpg',    // floor
  'img/marble.jpg',      // next
  'img/marble.jpg'          // reserve
];



var dashboard;
var dblog;
var dbscorev;
var sound_on = true;

var debugmode = false;
var nextobj, reserveobj;
var triple_game = new TRIPLE_GAME();
var PLACE_WIDTH = 50;
var PLACE_X     = -80;
var PLACE_Y     = 0;
var PLACE_Z     = -150;

var FIGURE_HEIGHT = 15;
var FIGURE_WIDTH  = 20;


var OBJECT_INFO = function( type, x, y, fig )
{
    this.type = type;
    this.x = x;
    this.y = y;
    this.fig = fig;
};


function init()
{
    
    
    dashboard = document.getElementById('dashboard');
    dblog = document.getElementById('dblog');
    dbscorev = document.getElementById('dbscorev');
    
    // SCENE
    scene = new THREE.Scene();
    
        // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0, 270, 200);
    camera.lookAt(scene.position);

    // RENDERER
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    document.body.appendChild(renderer.domElement);

    // EVENTS
    THREEx.WindowResize(renderer, camera);
//	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

    // CONTROLS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
//    controls = new THREE.DeviceOrientationControls(camera, renderer.domElement);

    // LIGHT

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(-1000, 1000, 1000);
    scene.add(light);

    var light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(1000, 1000, -1000);
    scene.add(light);
    
    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 1000, 0 );
    scene.add( hemiLight );
    

    // SKYBOX/FOG
    var skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x666666, side: THREE.BackSide});
    var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
    scene.add(skyBox);
   
    create_places();
    start_new_game();
    

    // initialize object to perform world/screen calculations
    projector = new THREE.Projector();

    document.addEventListener('click', onDocumentClick, false);

}


function create_place( x, y, typ )
{
    var Texture = new THREE.ImageUtils.loadTexture( PLACE_TEXTURE_IMG[typ] );
    Texture.wrapS = Texture.wrapT = THREE.RepeatWrapping; 
    Texture.repeat.set( 1, 1 );
    var Material = new THREE.MeshPhongMaterial( { map: Texture, side: THREE.DoubleSide } );
    var Material = new THREE.MeshBasicMaterial( { map: Texture, side: THREE.DoubleSide } );
    var cubeGeometry = new THREE.BoxGeometry(48, 1, 48);
    var cube = new THREE.Mesh(cubeGeometry, Material);
    cube.position.set(x * PLACE_WIDTH + PLACE_X, PLACE_Y, y * PLACE_WIDTH + PLACE_Z);
    cube.name = 'place_'+x+'_'+y;
    cube.object_info = new OBJECT_INFO('place', x, y, 0);
//    scene.add(cube);
    return cube;
}

function create_places()
{
    var obj;

    // base floor
    for (var y = 0; y < board_size; ++y) 
        for (var x = 0; x < board_size; ++x) {
//            obj = place0.clone();
            obj = create_place(x, y, 0);
            scene.add(obj);
    }        
    
    var obj = create_place(-2, 4, 1);
    obj.name = 'nextfigure_place';
    scene.add(obj);

    var obj = create_place(-2, 2, 2);
    obj.name = 'reserve_place';
    scene.add(obj);
}


function scale_figure( obj, fig )
{
    var x = obj.object_info.x;
    var y = obj.object_info.y;
    var figsize = (fig > 99) ? fig - 100 : fig;
    obj.position.set(x * PLACE_WIDTH  + PLACE_X, figsize * FIGURE_HEIGHT / 2.0  + PLACE_Y, y * PLACE_WIDTH  + PLACE_Z);
    obj.scale.set(1 + figsize * 0.1, figsize, 1 + figsize * 0.1 );
}


function create_figure( x, y, fig )
{
    var Texture;
    if(fig > 99)
        Texture = new THREE.ImageUtils.loadTexture( FIGURE_TEXTURE2_IMG );
    else
        Texture = new THREE.ImageUtils.loadTexture( FIGURE_TEXTURE_IMG );
    Texture.wrapS = Texture.wrapT = THREE.RepeatWrapping; 
    Texture.repeat.set( 1, 1 );
    var Material = new THREE.MeshPhongMaterial( { map: Texture, side: THREE.DoubleSide } );
    var cubeGeometry = new THREE.BoxGeometry(FIGURE_WIDTH, FIGURE_HEIGHT, FIGURE_WIDTH);
    var cube = new THREE.Mesh(cubeGeometry, Material);
    scene.add(cube);
    cube.name = 'figure_'+x+'_'+y;
    cube.object_info = new OBJECT_INFO('figure', x, y, fig);
    scale_figure(cube, fig);
    return cube;
}

function change_figure_size( obj, new_fig ) {

    var fo = {f: obj.object_info.fig};
    var fo_end = {f: new_fig};
    var tween = new TWEEN.Tween( fo )
        .to(fo_end, 1400)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onUpdate(function() {
            scale_figure(obj, fo.f);
        })
        .start();
    setTimeout(function() {
        sound_grow();
    }, 600);
}

function update_board() {
    for(var y=0; y<BOARD_SIZE; ++y) for(var x=0; x<BOARD_SIZE; ++x) {
        var fig = triple_game.get_figure(x,y);
        var obj = scene.getObjectByName('figure_'+x+'_'+y);
        if(fig > 0) {
            if(! obj)
              obj = create_figure(x,y,fig);
            if(obj && (obj.object_info.fig !== fig)) {
                change_figure_size(obj, fig);
                obj.object_info.fig = fig;
            }
        } else {
            if(obj) {
                scene.remove(obj);
                obj = null;
            }
        }    
    }
    
    dbscorev.innerHTML = triple_game.total_score();
    if( triple_game.game_over() )
      dblog.innerHTML = 'GAME OVER';
    else
      dblog.innerHTML = '';
        
}



function moveFigureToPlace( fig, place )
{
    var tween = new TWEEN.Tween( fig.position )
        .to({x: place.position.x, z: place.position.z}, 1200)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onComplete(update_board)
        .start();
};
    

function start_new_game() {
    triple_game.new_game();
    nextobj = create_figure( -2, 4, triple_game.next_figure() );
    reserveobj = null;
    update_board();
}


function set_figure_place( obj, place ) 
{
    var x = place.object_info.x;
    var y = place.object_info.y;
    obj.object_info.x = x;
    obj.object_info.y = y;
    obj.name = 'figure_'+x+'_'+y;
}

function user_move( place ) {
    
    var x = place.object_info.x;
    var y = place.object_info.y;
    triple_game.user_move(x,y);
    nextobj.object_info.x = x;
    nextobj.object_info.y = y;
    nextobj.name = 'figure_'+x+'_'+y;
    moveFigureToPlace( nextobj, place );
    setTimeout(function() {
        nextobj = create_figure( -2, 4, triple_game.next_figure() );
    }, 1000);
}


function swap_reserve() {
    var place_n = scene.getObjectByName('nextfigure_place');
    var place_r = scene.getObjectByName('reserve_place');
    if( reserveobj ) {
      triple_game.reserve( true );  
      moveFigureToPlace( nextobj, place_r );
      moveFigureToPlace( reserveobj, place_n );
      var obj = nextobj;
      nextobj = reserveobj;
      reserveobj = obj;
      set_figure_place(nextobj, place_n);
      set_figure_place(reserveobj, place_r);
    } else {
      moveFigureToPlace( nextobj, place_r );
      reserveobj = nextobj;
      setTimeout(function() {
        nextobj = create_figure( -2, 4, triple_game.reserve( true ) );
        set_figure_place(nextobj, place_n);
        set_figure_place(reserveobj, place_r);
      }, 1000);
    }
}


function animate()
{
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    update();
}


function update() {
  controls.update();
  TWEEN.update();
}  


function getClickedObject(event)
{
    var mouse_x = (event.clientX / window.innerWidth) * 2 - 1;
    var mouse_y = -(event.clientY / window.innerHeight) * 2 + 1;
    var vector = new THREE.Vector3(mouse_x, mouse_y, 1);
    vector.unproject(camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = ray.intersectObjects(scene.children);
    return (intersects.length > 0) ? intersects[ 0 ].object : null;
};


function sound_tock()
{
    if(sound_on) {
      var snd = new Audio("wav/woodblock.wav"); // buffers automatically when created
      snd.play();
  }
}

function sound_grow()
{
    if(sound_on) {
      var snd = new Audio("wav/grow.wav"); // buffers automatically when created
      snd.play();
  }
}


function onDocumentClick(event)
{
    var obj = getClickedObject(event);
    if(debugmode) {
        if (obj && obj.name) {
            dblog.innerHTML = 
            obj.object_info.type + ' ' + obj.object_info.x + ',' + obj.object_info.y
            + ' ' + obj.position.x 
            + ',' + obj.position.y 
            + ',' + obj.position.z; 
            ;
        } else {
            dblog.innerHTML = '';
            update_board();
        }
    }
   
    if( obj && obj.object_info ) {

        if( obj.name === 'reserve_place' ) {
            swap_reserve();
            sound_tock();
            return;
        }

        if( obj.name === 'figure_-2_2' ) {
            swap_reserve();
            sound_tock();
            return;
        }

        if( obj.object_info.type === 'place' ) {
          if( triple_game.is_legal_move(obj.object_info.x, obj.object_info.y) ) {
              user_move(obj);
              sound_tock();
          }
          return;
        }
        

    }  
   
};


          
function helpClick()
{
  var el =  document.getElementById('helptext');
  if(el.className === "")
    el.className = "hidden";
  else
    el.className = "";
};

function switchSound()
{
    var el =  document.getElementById('btnsound');
    sound_on = ! sound_on;
    el.innerHTML = sound_on ? "Sound Off" : "Sound On";
}



   


   
    