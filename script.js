const user = localStorage.getItem("kasatria_user");

if (!user) {
  window.location.href = "login.html";
}


import * as THREE from "./threejs/three.module.js";
import { CSS3DRenderer, CSS3DObject } from "./threejs/CSS3DRenderer.js";
import { TrackballControls } from "./threejs/TrackballControls.js"; 
import {OrbitControls} from "./threejs/OrbitControls.js";
import TWEEN from "./threejs/tween.module.min.js";

let camera, scene, renderer;
let controls;

const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

const SHEET_ID = "1HpvXoN-YGaxngXqa1BKdthDzvhFmSnC42qixfQW78YQ";
const SHEET_NAME = "data";

async function fetchPeopleData() {
  const url =
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  const res = await fetch(url);
  const text = await res.text();
  const json = JSON.parse(text.substring(47).slice(0, -2));

  return json.table.rows.map(r => ({
    name: r.c[0]?.v ?? "",
    photo: r.c[1]?.v ?? "",
    age: r.c[2]?.v ?? "",
    country: r.c[3]?.v ?? "",
    interest: r.c[4]?.v ?? "",
    netWorth: Number(
      String(r.c[5]?.v ?? "0").replace(/[$,]/g, "")
    )
  }));
}

// Function to get background color based on net worth
function getNetWorthColor(netWorth) {
  if (netWorth < 100000) {
    return 'rgba(220, 38, 38, 0.85)'; // Red
  } else if (netWorth < 200000) {
    return 'rgba(249, 115, 22, 0.85)'; // Orange
  } else {
    return 'rgba(34, 197, 94, 0.85)'; // Green
  }
}

// Function to get initials from name
function getInitials(name) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return parts[0].substring(0, 2).toUpperCase();
}

fetchPeopleData().then(people => {
  console.log(`Loaded ${people.length} people from Google Sheets`);
  initPeople(people);
  animate();
});

function initPeople(people) {

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 3000;

  scene = new THREE.Scene();

  people.forEach((person, i) => {

    const element = document.createElement("div");
    element.className = "element";

    // Create the element structure matching Image B with photo
    const initials = getInitials(person.name);
    const firstName = person.name.split(' ')[0];
    
    element.innerHTML = `
      <div class="number">${i + 1}</div>
      <img src="${person.photo}" class="avatar">
      <div class="symbol">${initials}</div>
      <div class="details">${firstName}<br>${person.country} · Age ${person.age}</div>
      <div class="details-extra">${person.interest}<br>$${person.netWorth.toLocaleString()}</div>
    `;

    // Set background color based on Net Worth
    element.style.backgroundColor = getNetWorthColor(person.netWorth);

    const cssObject = new CSS3DObject(element);
    cssObject.position.set(
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000,
      Math.random() * 4000 - 2000
    );

    scene.add(cssObject);
    objects.push(cssObject);

  });

  // === TABLE: 20x10 arrangement ===
  const cols = 20;
  const rows = 10;
  const tableSpacing = 200; // Increased spacing for table
  
  for (let i = 0; i < objects.length; i++) {
    const object = new THREE.Object3D();
    
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    // Center the table
    object.position.x = (col * tableSpacing) - ((cols - 1) * tableSpacing / 2);
    object.position.y = -(row * tableSpacing) + ((rows - 1) * tableSpacing / 2);
    object.position.z = 0;
    
    targets.table.push(object);
  }

  // === SPHERE ===
  const vector = new THREE.Vector3();
  for (let i = 0; i < objects.length; i++) {
    const phi = Math.acos(-1 + (2 * i) / objects.length);
    const theta = Math.sqrt(objects.length * Math.PI) * phi;

    const obj = new THREE.Object3D();
    obj.position.setFromSphericalCoords(800, phi, theta);
    vector.copy(obj.position).multiplyScalar(2);
    obj.lookAt(vector);
    targets.sphere.push(obj);
  }

  // === DOUBLE HELIX ===
  const helixRadius = 700;
  const helixVerticalSpacing = 10;
  
  for (let i = 0; i < objects.length; i++) {
    const obj = new THREE.Object3D();
    
    // Determine which helix (0 or 1)
    const helixIndex = i % 2;
    
    // Calculate position for each person
    const personIndex = Math.floor(i / 2);
    
    // Calculate angle - each helix is offset by 180 degrees
    const theta = (personIndex * 0.30) + Math.PI + (helixIndex * Math.PI);
    const y = -(i * helixVerticalSpacing) + 900;
    
    // Position on cylinder with offset for double helix
    const x = helixRadius * Math.cos(theta);
    const z = helixRadius * Math.sin(theta);
    
    obj.position.set(x, y, z);
    
    vector.x = x * 2;
    vector.y = y;
    vector.z = z * 2;
    obj.lookAt(vector);
    
    targets.helix.push(obj);
  }

  // === GRID: 5x4x10 (5 columns, 4 rows, 10 layers deep) ===
  // MUCH LARGER spacing to ensure complete separation
  const gridCols = 5;
  const gridRows = 4;
  const gridLayers = 10;
  const gridSpacing = 400; // MUCH larger spacing - no overlap!
  
  for (let i = 0; i < objects.length; i++) {
    const obj = new THREE.Object3D();
    
    const col = i % gridCols;
    const row = Math.floor(i / gridCols) % gridRows;
    const layer = Math.floor(i / (gridCols * gridRows));
    
    obj.position.x = (col * gridSpacing) - ((gridCols - 1) * gridSpacing / 2);
    obj.position.y = -(row * gridSpacing) + ((gridRows - 1) * gridSpacing / 2);
    obj.position.z = (layer * gridSpacing) - ((gridLayers - 1) * gridSpacing / 2);
    
    targets.grid.push(obj);
  }

  // Renderer
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  // Controls
  controls = new TrackballControls(camera, renderer.domElement);
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  // Button events
  document.getElementById("table").onclick = () => transform(targets.table, 2000);
  document.getElementById("sphere").onclick = () => transform(targets.sphere, 2000);
  document.getElementById("helix").onclick = () => transform(targets.helix, 2000);
  document.getElementById("grid").onclick = () => transform(targets.grid, 2000);

  transform(targets.table, 2000);

  window.addEventListener("resize", onWindowResize);
}


function transform(targets, duration) {

  TWEEN.removeAll();

  for (let i = 0; i < objects.length; i++) {

    const object = objects[i];
    const target = targets[i];

    new TWEEN.Tween(object.position)
      .to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

  }

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
  render();
}


function render() {
  renderer.render(scene, camera);

}

// Log out Feature
function setupLogout() {
  const logoutBtn = document.getElementById("logout");
  if (!logoutBtn) return;

  logoutBtn.onclick = () => {
    localStorage.removeItem("kasatria_user");
    window.location.href = "login.html";
  };
}

setupLogout();
