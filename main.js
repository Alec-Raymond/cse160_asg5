import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
function onWindowResize() {
  // Update camera aspect ratio and projection matrix
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  // Update renderer size
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const fov = 75;
const aspect = 2;  // The canvas default
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
const spotlight = new THREE.SpotLight(0xFFFFFF, 1, 20, Math.PI / 4, 0.5, 2);  // White light, distance, angle, decay
spotlight.position.set(3.5, 7, 4.6);  // Position it near the lighthouse (adjust as needed)
spotlight.target.position.set(0, 0, 0);  // Point the spotlight at the ground or any target
spotlight.castShadow = true;  // Enable shadows
scene.add(spotlight);
scene.add(spotlight.target);

// Create a helper to visualize the spotlight (optional)


// Function to animate the rainbow effect
function updateSpotlightColor(time) {
  const colors = [
    0xFF0000, // Red
    0xFF7F00, // Orange
    0xFFFF00, // Yellow
    0x00FF00, // Green
    0x0000FF, // Blue
    0x4B0082, // Indigo
    0x8B00FF  // Violet
  ];

  // Calculate the index based on the time, creating a smooth transition between the colors
  const colorIndex = Math.floor((time * 0.5) % colors.length);  // Adjust speed of color change
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

// Create Cubes
const cubes = [
  makeCubeInstance(boxGeo, 0x44aa88, [-2, 1, 2]),
  makeCubeInstance(boxGeo, 0x8844aa, [-2, 1, -2]),
  makeCubeInstance(boxGeo, 0xaa8844, [2, 1, -2]),
  makeCubeInstance(boxGeo, 0xaa8844, [2, 1, 2]),
  makeCubeInstance(boxGeo, 0xaa8844, [0, 2, 0]),
];

{
  const objLoader = new OBJLoader();
  objLoader.load('resources/lighthouse.obj', (root) => {
    root.position.set(4, 0, 6);
    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    scene.add(root);
  });
}

// Ground Plane
const groundGeo = new THREE.PlaneGeometry(50, 50);
const sandTexture = loader.load('resources/sand.jpg');
sandTexture.wrapS = THREE.RepeatWrapping;
sandTexture.wrapT = THREE.RepeatWrapping;

// Set repeat factor (adjust as needed)
sandTexture.repeat.set(7,7);
texture.colorSpace = THREE.SRGBColorSpace;
const groundMaterial = new THREE.MeshPhongMaterial({ map: sandTexture });
const ground = new THREE.Mesh(groundGeo, groundMaterial);
ground.receiveShadow = true;
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);
// Raycasting variables
// Raycasting variables
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;  // To store the currently highlighted object

// Add mouse event listener for the raycaster
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onMouseClick, false);

// Handle mouse movement to update normalized mouse coordinates
function onMouseMove(event) {
  // Normalize mouse coordinates to range [-1, 1] for both axes
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Handle mouse click to select an object (optional)
function onMouseClick() {
  if (selectedObject) {
    console.log('Selected object:', selectedObject);
  }
}

// Update raycasting and highlight the intersected mesh
function updateRaycaster() {
  // Set the raycaster from the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Find intersections between the ray and all objects in the scene
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersectedObject = intersects[0].object;

    // Highlight the intersected object by changing its emissive color
    if (selectedObject !== intersectedObject) {
      // Reset the previous object (if any)
      if (selectedObject) {
        selectedObject.material.emissive.set(0x000000);  // Remove glow
      }
      // Set new selected object and highlight it
      selectedObject = intersectedObject;
      selectedObject.material.emissive.set(0xffaa00);  // Green glow for highlighting
    }
  } else {
    // If no object is intersected, reset the highlight
    if (selectedObject) {
      selectedObject.material.emissive.set(0x000000);
      selectedObject = null;
    }
  }
}

// In the render loop, call `updateRaycaster` to continuously check for mouse intersections
function render(time) {
  time *= 0.001; // Convert time to seconds

  cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * 0.1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });

  updateSpotlightColor(time); // Assuming this function is defined elsewhere
  updateRaycaster();            // Update raycasting on every frame

  controls.update();            // Required for damping effect
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);


// Lights
function addLights(scene) {
  const color = 0xFFFFFF;
  let intensity = 1;
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(-1, 2, 4);
  directionalLight.castShadow = true;
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;  // Higher resolution for softer shadows
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

  // Create random shapes with random positions and sizes
  for (let i = 0; i < 25; i++) {
    const shapeType = Math.floor(Math.random() * 3); // 0: Cube, 1: Sphere, 2: Cylinder
    const x = center[0] + Math.random() * 6 - 3;  // Random X offset from center
    const y = center[1] + Math.random() * 2 + 0.5; // Random Y offset from center
    const z = center[2] + Math.random() * 6 - 3;  // Random Z offset from center
    const scale = Math.random() * 1.5 + 1.0; // Random scale between 0.5 and 1.0

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

// Create the rock outcropping with a specified center and add it to the scene
const centerOfRock = [4, 0, 6];  // Example center coordinates for the outcropping
function makeRockOutcroppingsInCircle(center = [0, 0, 0], radius = 5, numOutcroppings = 10) {
  const angleStep = (Math.PI * 2) / numOutcroppings; // Divide the full circle by the number of outcroppings

  // Loop through each position and create an outcropping
  for (let i = 0; i < numOutcroppings; i++) {
    const angle = i * angleStep; // Calculate the angle for each position in the circle
    const x = center[0] + radius * Math.cos(angle); // X position based on angle
    const z = center[2] + radius * Math.sin(angle); // Z position based on angle
    const y = center[1]; // Y position (same as center's Y)

    // Create a rock outcropping at each position
    makeRockOutcropping([x, y, z]);
  }
}

// Example: Create 10 rock outcroppings in a circle with radius 5 centered at (0, 0, 0)
makeRockOutcroppingsInCircle([0, 0, 0], 25, 100);

