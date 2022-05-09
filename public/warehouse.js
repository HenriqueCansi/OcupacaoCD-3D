// import * as THREE from 'three';


// const concreteTexture = new THREE.TextureLoader().load(
//     './textures/Concrete.jpg'
// );
// const concreteMaterial = new THREE.MeshMatcapMaterial({
//     map: concreteTexture,
//     //     normalMap: texture,
//     // });
// });

// const concreteTextureFloor = new THREE.TextureLoader().load(
//     './textures/ConcreteFloor.jpg'
// );
// const concreteMaterialFloor = new THREE.MeshMatcapMaterial({
//     map: concreteTextureFloor,
// });

// const plane = new THREE.Mesh(
//     //largura, comprimento, ?, ?
//     new THREE.PlaneGeometry(larguraCd + 30, comprimentoCd + 20, 10, 10),
//     concreteMaterialFloor
// );

// plane.castShadow = false;
// plane.position.set(larguraCd / 2, -0.5, comprimentoCd / 2);
// //plane.receiveShadow = true;
// plane.rotation.x = -Math.PI / 2;
// this.scene_.add(plane);

// const wall1 = new THREE.Mesh(
//     new THREE.BoxGeometry(larguraCd + 30, 30, 1),
//     concreteMaterial
// );
// wall1.position.set(larguraCd / 2, 0, -10);
// wall1.castShadow = true;
// wall1.receiveShadow = true;
// this.scene_.add(wall1);

// const wall2 = new THREE.Mesh(
//     new THREE.BoxGeometry(larguraCd + 30, 30, 1),
//     concreteMaterial
// );
// console.log(wall2);
// wall2.position.set(larguraCd / 2, 0, comprimentoCd + 10);
// wall2.castShadow = true;
// wall2.receiveShadow = true;
// this.scene_.add(wall2);

// const wall3 = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 30, comprimentoCd + 20),
//     concreteMaterial
// );
// wall3.position.set(larguraCd + 15, 0, comprimentoCd / 2);
// wall3.castShadow = true;
// wall3.receiveShadow = true;
// this.scene_.add(wall3);

// const wall4 = new THREE.Mesh(
//     new THREE.BoxGeometry(1, 30, comprimentoCd + 20),
//     concreteMaterial
// );
// wall4.position.set(-15, 0, comprimentoCd / 2);
// wall4.castShadow = true;
// wall4.receiveShadow = true;
// this.scene_.add(wall4);
