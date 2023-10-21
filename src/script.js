/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './main.css'
import * as THREE from 'three'
import * as CANNON from 'cannon-es';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'


/////////////////////////////////////////////////////////////////////////
//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader()
const loader = new GLTFLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.createElement('div')
document.body.appendChild(container)

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new THREE.Scene()
scene.background = new THREE.Color('#EEEEEE')


/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new THREE.WebGLRenderer({ antialias: true}) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
container.appendChild(renderer.domElement) // add the renderer to html div

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 2000 );
scene.add(camera)
camera.position.set(0,25,0); // Set position like this
camera.lookAt(new THREE.Vector3(0,0,0)); // Set look at coordinate like this


/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener('resize', () => {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    renderer.setSize(width, height)
    renderer.setPixelRatio(2)
})

/////////////////////////////////////////////////////////////////////////
///// CREATE ORBIT CONTROLS
//const controls = new OrbitControls(camera, renderer.domElement)

/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const ambient = new THREE.AmbientLight(0xFFFFFF, 0.5)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.96)
sunLight.position.set(-69,44,14)
sunLight.castShadow = true;
scene.add(sunLight)


/////////////////////////////////////////////////////////////////////////
////// VARIABLES AND CONSTS
var is_rolling = false;
const throw_btn = document.getElementById("Throw");
throw_btn.disabled = true;

/////////////////////////////////////////////////////////////////////////
////// AUDIO

const listener = new THREE.AudioListener();
camera.add(listener);


const diceSound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('sounds/Dice.mp3', function(buffer){
  diceSound.setBuffer( buffer );
	diceSound.setLoop( false );
	diceSound.setVolume( 0.5);
	//diceSound.play();
});

/////////////////////////////////////////////////////////////////////////
///// LOADING GLB/GLTF MODEL FROM BLENDER

let dice = 0

loader.load( 'models/gltf/dice.glb', function ( gltf ) {

	dice =  gltf.scene;
  dice.scale.set(2,2,2);
  dice.position.set(0, 3, 0)
  dice.castShadow = true;
  dice.receiveShadow = true;
  scene.add(dice);

}, undefined, function ( error ) {

	console.error( error );

} );

//////////////////////////////////////////////////////////////////////////
///// ADD PLANE TO SCENE
const geometry = new THREE.PlaneGeometry( 200, 200 );
const material = new THREE.MeshBasicMaterial( {color: 0xFFFFFF, side: THREE.DoubleSide,} );
const plane = new THREE.Mesh( geometry, material );
plane.rotateX( - Math.PI / 2);
plane.position.set(0,1,0);
plane.receiveShadow = true;
plane.castShadow = true;
//scene.add( plane );

/*
/////////////////////////////////////////////////////////////////////////
//// DEFINE ORBIT CONTROLS LIMITS
function setOrbitControlsLimits(){
    controls.enableDamping = true
    controls.dampingFactor = 0.04
    controls.minDistance = 0
    controls.maxDistance = 500
    controls.enableRotate = true
    controls.enableZoom = true
    //controls.maxPolarAngle = Math.PI /2.5
}

setOrbitControlsLimits()
*/
/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION
function rendeLoop() {

    TWEEN.update() // update animations

    //controls.update() // update orbit controls

    renderer.render(scene, camera) // render the scene using the camera

    requestAnimationFrame(rendeLoop) //loop the render function
    
}

rendeLoop() //start rendering

/////////////////////////////////////////////////////////////////////////
///// INITIALIZE PHYSICS
const groundPhysMat = new CANNON.Material();

const physicsWorld = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane,
  material: groundPhysMat,
})


groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
//southBarrier.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physicsWorld.addBody(groundBody);
//physicsWorld.addBody(southBarrier);

const northWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane,
  material: groundPhysMat,
  position: new CANNON.Vec3(0,0,-10)
})

physicsWorld.addBody(northWallBody);

const southWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane,
  material: groundPhysMat,
  position: new CANNON.Vec3(0,0,8)
})
southWallBody.quaternion.setFromEuler(0, -Math.PI, 0);

physicsWorld.addBody(southWallBody);

const eastWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane,
  material: groundPhysMat,
  position: new CANNON.Vec3(15,0,0)
})
eastWallBody.quaternion.setFromEuler(0, -Math.PI/2, 0);

physicsWorld.addBody(eastWallBody);

const westWallBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Plane,
  material: groundPhysMat,
  position: new CANNON.Vec3(-15,0,0)
})
westWallBody.quaternion.setFromEuler(0, Math.PI/2, 0);

physicsWorld.addBody(westWallBody);

const boxPhysMat = new CANNON.Material();
const diceBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(1,1,1)),
  material: boxPhysMat
});

diceBody.position.set(0, 3, 0);
physicsWorld.addBody(diceBody);



//diceBody.angularVelocity.set(0, 6, 3);
//diceBody.applyImpulse(new CANNON.Vec3(-4, 3, 1),new CANNON.Vec3(1, 0, 0));
//diceBody.angularDamping = 0.5;

const groundBoxContactMat = new CANNON.ContactMaterial(
  groundPhysMat,
  boxPhysMat,
  {restitution:0.0,friction:0.9}
);

physicsWorld.addContactMaterial(groundBoxContactMat);

///////////////////////////////////////////////////
////// ROLL FUNCTION

function generateRandom(min = 0, max = 100) {
  let difference = max - min;
  let rand = Math.random(); 
  rand = Math.floor( rand * difference);
  rand = rand + min;
  return rand;
}

console.log(generateRandom());


function roll(){

  var corner_no = generateRandom(1,5);
  
  if (corner_no === 1){
    var minx = 0;
    var maxx = 1;
    var minz = -1;
    var maxz = 0;
    diceBody.position.set(-12, 3, 5);
    console.log("mr corner 1");
    console.log();
  }

  if (corner_no === 2){
    var minx = -1;
    var maxx = 0;
    var minz = -1;
    var maxz = 0;
    diceBody.position.set(12, 3, 5);
    console.log("mr corner 2")
  }

  if (corner_no === 3){
    var minx = 0;
    var maxx = 1;
    var minz = 0;
    var maxz = 1;
    diceBody.position.set(-12, 3, -7);
    console.log("mr corner 3")
  }

  if (corner_no === 4){
    var minx = -1;
    var maxx = 0;
    var minz = 0;
    var maxz = 1;
    diceBody.position.set(12, 3, -7);
    console.log("mr corner 4")
  }

  var xImpulse = Math.random() * (maxx - minx) + minx;
  //var yImpulse = Math.random() * (max - min) + min;
  var zImpulse = Math.random() * (maxz - minz) + minz;
  console.log("Impulse.x = " + xImpulse + " | " + "Impulse.z = " + zImpulse );
  diceBody.velocity.set(0,0,0);
  diceBody.angularVelocity.set(0,0,0);
  //diceBody.applyImpulse(new CANNON.Vec3(xImpulse*35, 0, zImpulse*35),new CANNON.Vec3(0, 0, 0))
  diceBody.applyForce(new CANNON.Vec3(xImpulse*7500, 0, zImpulse*7500),new CANNON.Vec3(0, 0, 0))
}

function doneRolling(){
  is_rolling = true;
  throw_btn.disabled = false;
}

function playDiceSound(){
  if (diceSound.isPlaying === true){
    diceSound.stop();
  }
  diceSound.play();
}

setTimeout(doneRolling, 3500);
//setTimeout(playDiceSound, 200);


function animate() {
  physicsWorld.fixedStep();
  
	requestAnimationFrame( animate );
  if (diceBody.position === undefined || dice.position === undefined){
    return   
  }
  dice.position.copy(diceBody.position);
  dice.quaternion.copy(diceBody.quaternion);
}

animate();

/*Event Listeners*/
window.addEventListener("resize", ()=>{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

throw_btn.addEventListener('click', throwClicked);
function throwClicked(){
  roll();
  console.log(is_rolling);
  setTimeout(doneRolling, 3500);
  setTimeout(playDiceSound, 800);
  throw_btn.disabled = true;
}