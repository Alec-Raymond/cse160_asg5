import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const fov = 75;
const aspect = 2;  
const near = 0.1;
const far = 50;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 2, 5); // Start position
console.log(camera.position);

const scene = new THREE.Scene();
{
  const color = 0xFFFFFF;  // white
  const near = 1;
  const far = 50;
  scene.fog = new THREE.Fog(color, near, far);
}
addLights(scene);

// Create a Spotlight from the Lighthouse
const spotlight = new THREE.SpotLight(0xFFFFFF, 2, 20, Math.PI / 4, 0.5, 2);  
spotlight.position.set(3.5, 7, 4.6);  
spotlight.target.position.set(0, 0, 0);  
spotlight.castShadow = true; 
scene.add(spotlight);
scene.add(spotlight.target);

// Function to animate the rainbow effect
function updateSpotlightColor(time) {
  const colors = [
    0xFF0000, 
    0xFF7F00, 
    0xFFFF00, 
    0x00FF00, 
    0x0000FF, 
  ];
  const colorIndex = Math.floor((time * 0.5) % colors.length);  
  spotlight.color.setHex(colors[colorIndex]);


}

const loader = new THREE.TextureLoader();
const texture = loader.load('resources/rock.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

const cubeLoader = new THREE.CubeTextureLoader();
const backgroundTexture = cubeLoader.load([
  'resources/sky2.jpg',
  'resources/sky2.jpg',
  'resources/sky2.jpg',
  'resources/sky2.jpg',
  'resources/sky2.jpg',
  'resources/sky2.jpg',
]);
scene.background = backgroundTexture;

// Orbit Controls for Mouse Navigation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth rotation
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;  // Minimum zoom
controls.maxDistance = 10; // Maximum zoom
controls.maxPolarAngle = (Math.PI - 0.05) / 2; // Prevent flipping

// Cube Geometry
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function makeCubeInstance(geometry, color, [x, y, z]) {
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  cube.position.set(x, y, z);
  return cube;
}


const cubes = [
  makeCubeInstance(boxGeo, 0x44aa88, [-2, 1, 2]),
  makeCubeInstance(boxGeo, 0x8844aa, [-2, 1, -2]),
  makeCubeInstance(boxGeo, 0xaa8844, [2, 1, -2]),
  makeCubeInstance(boxGeo, 0xaa8844, [2, 1, 2]),
  makeCubeInstance(boxGeo, 0xaa8844, [0, 2, 0]),
];


const mtlLoader = new MTLLoader();
mtlLoader.setPath('./');
mtlLoader.load('lighthouse.mtl', (materials) => {
  materials.preload();  // Preload the materials

  for (let materialName in materials.materials) {
    const material = materials.materials[materialName];

    material.flatShading = THREE.SmoothShading;
    material.needsUpdate = true;

    material.color.set(0xffffff)

  }

  const objLoader = new OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath('./');
  objLoader.load('lighthouse.obj', (object) => {
    object.position.set(4, 0, 6);
    object.scale.set(0.2, 0.2, 0.2); // Scale it down as needed

    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    scene.add(object);
  });
});



// Ground Plane
const groundGeo = new THREE.PlaneGeometry(50, 50);
const sandTexture = loader.load('resources/sand.jpg');
sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;
sandTexture.repeat.set(7,7);
texture.colorSpace = THREE.SRGBColorSpace;

const groundMaterial = new THREE.MeshPhongMaterial({ map: sandTexture });
const ground = new THREE.Mesh(groundGeo, groundMaterial);
ground.receiveShadow = true;
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);



const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null; 

window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseClick() {
  if (selectedObject) {
    console.log('Selected object:', selectedObject);
  }
}

// Update raycasting and highlight the intersected mesh
function updateRaycaster() {
  raycaster.setFromCamera(mouse, camera);


  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;

    // Highlight the intersected object by changing its emissive color
    if (selectedObject !== intersectedObject) {
      if (selectedObject) {
        selectedObject.material.emissive.set(0x000000);
      }
      selectedObject = intersectedObject;
      selectedObject.material.emissive.set(0xffaa00); 
    }
  } else {
    if (selectedObject) {
      selectedObject.material.emissive.set(0x000000);
      selectedObject = null;
    }
  }
}


function render(time) {
  time *= 0.001; 

  cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * 0.1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });

  updateSpotlightColor(time); 
  updateRaycaster();        

  controls.update();            
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);


// Lights
function addLights(scene) {
  const color = 0xFFFFFF;
  let intensity = 1;
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(-10, 20, 40);
  directionalLight.castShadow = true;
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;  
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  const skyColor = 0xB1E1FF; // Light blue
  const groundColor = 0xB97A20;
  intensity = 0.5;
  const ambientLight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(ambientLight);
}


// Sphere Geometry
const sphereGeo = new THREE.SphereGeometry(0.5, 16, 16);
function makeSphereInstance(geometry, color, [x, y, z]) {
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  sphere.position.set(x, y, z);
  scene.add(sphere);
  return sphere;
}

// Cylinder Geometry
const cylinderGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 16);
function makeCylinderInstance(geometry, color, [x, y, z]) {
  const material = new THREE.MeshPhongMaterial({ map: texture });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  cylinder.position.set(x, y, z);
  scene.add(cylinder);
  return cylinder;
}


function makeRockOutcropping(center = [0, 0, 0]) {
  const outcropping = [];


  for (let i = 0; i < 25; i++) {
    const shapeType = Math.floor(Math.random() * 3);
    const x = center[0] + Math.random() * 6 - 3;  
    const y = center[1] + Math.random() * 2 + 0.5; 
    const z = center[2] + Math.random() * 6 - 3;  
    const scale = Math.random() * 1.5 + 1.0; 

    if (shapeType === 0) {
      const cube = makeCubeInstance(boxGeo, 0x444444, [x, y, z]);
      cube.scale.set(scale, scale, scale);
      outcropping.push(cube);
    } else if (shapeType === 1) {
      const sphere = makeSphereInstance(sphereGeo, 0x444444, [x, y, z]);
      sphere.scale.set(scale, scale, scale);
      outcropping.push(sphere);
    } else if (shapeType === 2) {
      const cylinder = makeCylinderInstance(cylinderGeo, 0x444444, [x, y, z]);
      cylinder.scale.set(scale, scale, scale);
      outcropping.push(cylinder);
    }
  }

  return outcropping;
}


function makeRockOutcroppingsInCircle(center = [0, 0, 0], radius = 5, numOutcroppings = 10) {
  const angleStep = (Math.PI * 2) / numOutcroppings; 


  for (let i = 0; i < numOutcroppings; i++) {
    const angle = i * angleStep;
    const x = center[0] + radius * Math.cos(angle);
    const z = center[2] + radius * Math.sin(angle); 
    const y = center[1]; 

    makeRockOutcropping([x, y, z]);
  }
}


makeRockOutcroppingsInCircle([0, 0, 0], 25, 100);

