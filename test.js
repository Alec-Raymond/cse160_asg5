import * as THREE from 'three';

function addLights(scene) {
  const color = 0xFFFFFF;
  var intensity = 1;
  const direction_light = new THREE.DirectionalLight(color, intensity);
  direction_light.position.set(-1, 2, 4);
  direction_light.castShadow = true;
  scene.add(direction_light);

  const skyColor = 0xB1E1FF;  // light blue
  const groundColor = 0xB97A20;
  intensity = 0.5;
  const ambient_light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  scene.add(ambient_light);
}

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const fov = 75;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set = (0, 5, 10);

const scene = new THREE.Scene();

addLights(scene);

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

const planeWidth = 9;
const planeHeight = 9;
const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight);

const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

function makeCubeInstance(geometry, color, [x, y, z]) {
  const material = new THREE.MeshPhongMaterial({ color });

  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);

  cube.position.x = x;
  cube.position.y = y;
  cube.position.z = z;

  return cube;
}

const cubes = [
  makeCubeInstance(boxGeo, 0x44aa88, [0, 0, 0]),
  makeCubeInstance(boxGeo, 0x8844aa, [-2, 1, -1]),
  makeCubeInstance(boxGeo, 0xaa8844, [2, 0, -0.5]),
];

const mesh = new THREE.Mesh(planeGeo, material);

renderer.setSize(1000, 500);

function render(time) {
  time *= 0.001;  // convert time to seconds

  lightPivot.rotation.y += 0.02;
  cubes.forEach((cube, ndx) => {
    const speed = 1 + ndx * .1;
    const rot = time * speed;
    cube.rotation.x = rot;
    cube.rotation.y = rot;
  });
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);


