import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';

import layoutText from "./layout.json" assert { type: "json" };
console.log(layoutText);

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(5));

//luzes
const light = new THREE.DirectionalLight();
light.position.set(10, 21, 7);
scene.add(light);
const light2 = new THREE.PointLight();
light2.position.set(10, 21, 7);
scene.add(light2);
const light3 = new THREE.AmbientLight();
light3.position.set(10, 21, 7);
scene.add(light3);
///luzes

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

//camera.position.z = 5;
camera.position.set(10, 30, 100);
camera.lookAt(scene.position);

//const texture = new THREE.TextureLoader().load('./textures/caixa.jpg');

// const RedTexture = new THREE.TextureLoader().load('./textures/vermelho.jpg');
// const materialRed = new THREE.MeshMatcapMaterial({
//     map: RedTexture,
//     normalMap: texture,
// });

// const YellowTexture = new THREE.TextureLoader().load('./textures/amarelo.jpg');
// const materialYellow = new THREE.MeshMatcapMaterial({
//     map: YellowTexture,
//     normalMap: texture,
// });

// const GreenTexture = new THREE.TextureLoader().load('./textures/verde.png');
// const materialGreen = new THREE.MeshMatcapMaterial({
//     map: GreenTexture,
//     normalMap: texture,
// });

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var vermelho = new THREE.MeshMatcapMaterial({ color: 0xff0000 });
var amarelo = new THREE.MeshMatcapMaterial({ color: 0xffff00 });
var verde = new THREE.MeshMatcapMaterial({ color: 0x00ff00 });

const layout = layoutText;
console.log('layout:',layout);
console.log('layout.lenfsath:',layout.length);

let posZ = 0;

for (let rua = 0; rua < layout.length; rua = rua + 1) {
    console.log('rua', rua);
    let ultLado = 0;

    var dadorua = layout[rua];
    //console.log(dadorua);

    let andar = dadorua['rua'].max_andares;

    var enderecos = dadorua['rua'].enderecos; //.filter(({lado}) => lado === 1);
    //console.log(enderecos);

    for (let end = 0; end < enderecos.length; end = end + 1) {
        //console.log(enderecos[end]);
        if (ultLado != enderecos[end].lado) {
            ultLado = enderecos[end].lado;
            posZ += 2;
        }

        var cor = amarelo;
        if (enderecos[end].cor === 'blq') cor = vermelho;
        if (enderecos[end].cor === 'liv') cor = verde;

        var cube = new THREE.Mesh(geometry, cor);

        cube.position.x = enderecos[end].posX * 0.6;
        cube.position.y = (enderecos[end].posY + andar) * 0.6;
        cube.position.z = posZ;
        scene.add(cube);
    }
    posZ -= 1;
}


const GltfLoader = new GLTFLoader();

GltfLoader.load('./warehouse/scene.gltf', function (gltf) {
    const model = gltf.scene;
    model.position.x = 10;
    model.position.y = -1;
    model.position.z = 30;
    model.scale.set(0.07,0.07,0.07);
    scene.add(model);
});

renderer.render(scene, camera);

console.log(window.innerWidth);


const stats = Stats();
document.body.appendChild(stats.dom);

function animate() {
    requestAnimationFrame(animate);
    // camera.lookAt(scene.position);
    controls.update();
    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

animate();