import * as THREE from 'three';
import { layoutText } from './layout.js';

const KEYS = {
    a: 65,
    s: 83,
    w: 87,
    d: 68,
};

let posZ;
let comprimentoCd = 0;
let larguraCd = 0;

function clamp(x, a, b) {
    return Math.min(Math.max(x, a), b);
}

class InputController {
    constructor(target) {
        this.target_ = target || document;
        this.initialize_();
    }

    initialize_() {
        this.current_ = {
            leftButton: false,
            rightButton: false,
            mouseXDelta: 0,
            mouseYDelta: 0,
            mouseX: 0,
            mouseY: 0,
        };
        this.previous_ = null;
        this.keys_ = {};
        this.previousKeys_ = {};
        this.target_.addEventListener(
            'mousedown',
            (e) => this.onMouseDown_(e),
            false
        );
        this.target_.addEventListener(
            'mousemove',
            (e) => this.onMouseMove_(e),
            false
        );
        this.target_.addEventListener(
            'mouseup',
            (e) => this.onMouseUp_(e),
            false
        );
        this.target_.addEventListener(
            'keydown',
            (e) => this.onKeyDown_(e),
            false
        );
        this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
    }

    onMouseMove_(e) {
        if (document.pointerLockElement === document.body) {
            this.current_.mouseXDelta = e.movementX;
            this.current_.mouseYDelta = e.movementY;
        } else {
            this.current_.mouseX = e.pageX - window.innerWidth / 2;
            this.current_.mouseY = e.pageY - window.innerHeight / 2;

            if (this.previous_ === null) {
                this.previous_ = { ...this.current_ };
            }

            this.current_.mouseXDelta =
                this.current_.mouseX - this.previous_.mouseX;
            this.current_.mouseYDelta =
                this.current_.mouseY - this.previous_.mouseY;
        }
    }

    onMouseDown_(e) {
        this.onMouseMove_(e);

        switch (e.button) {
            case 0: {
                this.current_.leftButton = true;
                break;
            }
            case 2: {
                this.current_.rightButton = true;
                break;
            }
        }
    }

    onMouseUp_(e) {
        this.onMouseMove_(e);

        switch (e.button) {
            case 0: {
                this.current_.leftButton = false;
                break;
            }
            case 2: {
                this.current_.rightButton = false;
                break;
            }
        }
    }

    onKeyDown_(e) {
        this.keys_[e.keyCode] = true;
    }

    onKeyUp_(e) {
        this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
        return !!this.keys_[keyCode];
    }

    isReady() {
        return this.previous_ !== null;
    }

    update(_) {
        if (this.previous_ !== null) {
            this.current_.mouseXDelta =
                this.current_.mouseX - this.previous_.mouseX;
            this.current_.mouseYDelta =
                this.current_.mouseY - this.previous_.mouseY;

            this.previous_ = { ...this.current_ };
        }
    }
}

class FirstPersonCamera {
    constructor(camera, collisionBoxes) {
        this.camera_ = camera;
        this.input_ = new InputController();
        this.rotation_ = new THREE.Quaternion();
        this.translation_ = new THREE.Vector3(0, 2, 0);
        this.phi_ = 0;
        this.phiSpeed_ = 8;
        this.theta_ = 0;
        this.thetaSpeed_ = 5;
        this.headBobActive_ = false;
        this.collisionBoxes_ = collisionBoxes;
    }

    update(timeElapsedS) {
        this.updateRotation_(timeElapsedS);
        this.updateCamera_(timeElapsedS);
        this.updateTranslation_(timeElapsedS);
        this.input_.update(timeElapsedS);
    }

    updateCamera_(_) {
        this.camera_.quaternion.copy(this.rotation_);
        this.camera_.position.copy(this.translation_);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.rotation_);

        const dir = forward.clone();

        forward.multiplyScalar(100);
        forward.add(this.translation_);

        let closest = forward;
        const result = new THREE.Vector3();
        const ray = new THREE.Ray(this.translation_, dir);
        // (Opcional: pode usar ray para highlight, etc)
        this.camera_.lookAt(closest);
    }

    updateTranslation_(timeElapsedS) {
        const forwardVelocity =
            (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0);
        const strafeVelocity =
            (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0);

        const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(qx).multiplyScalar(forwardVelocity * timeElapsedS * 10);
        const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(qx).multiplyScalar(strafeVelocity * timeElapsedS * 10);

        const movement = forward.add(left);
        if (movement.length() === 0) return;

        const nextPosition = this.translation_.clone().add(movement);
        const cameraSphere = new THREE.Sphere(nextPosition, 0.4);

        let colliding = false;

        for (let i = 0; i < this.collisionBoxes_.length; ++i) {
            const box = this.collisionBoxes_[i];
            if (box.intersectsSphere(cameraSphere)) {
                colliding = true;
                break;
            }
        }

        if (!colliding) {
            this.translation_.add(movement);
        }
    }

    updateRotation_(timeElapsedS) {
        const xh = this.input_.current_.mouseXDelta / window.innerWidth;
        const yh = this.input_.current_.mouseYDelta / window.innerHeight;

        this.phi_ += -xh * this.phiSpeed_;
        this.theta_ = clamp(
            this.theta_ + -yh * this.thetaSpeed_,
            -Math.PI / 3,
            Math.PI / 3
        );

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
        const qz = new THREE.Quaternion();
        qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

        const q = new THREE.Quaternion();
        q.multiply(qx);
        q.multiply(qz);

        this.rotation_.copy(q);
    }
}

class FirstPersonCameraDemo {
    constructor() {
        this.collisionBoxes_ = [];
        this.clickableMeshes_ = [];
        this.initialize_();
    }

    initialize_() {
        this.initializeRenderer_();
        this.initializeScene_();
        this.initializeDemo_();
        this.previousRAF_ = null;
        this.raf_();
        this.onWindowResize_();
    }

    initializeDemo_() {
        this.fpsCamera_ = new FirstPersonCamera(this.camera_, this.collisionBoxes_);
    }

    initializeRenderer_() {
        this.threejs_ = new THREE.WebGLRenderer({
            antialias: false,
        });
        this.threejs_.shadowMap.enabled = true;
        this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
        this.threejs_.setPixelRatio(window.devicePixelRatio);
        this.threejs_.setSize(window.innerWidth, window.innerHeight);
        this.threejs_.physicallyCorrectLights = true;
        this.threejs_.outputEncoding = THREE.sRGBEncoding;

        document.body.appendChild(this.threejs_.domElement);

        window.addEventListener(
            'resize',
            () => {
                this.onWindowResize_();
            },
            false
        );

        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 1.0;
        const far = 200.0;
        this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera_.position.set(0, 2, 0);

        this.scene_ = new THREE.Scene();

        // Crosshair
        this.uiCamera_ = new THREE.OrthographicCamera(
            -1,
            1,
            1 * aspect,
            -1 * aspect,
            1,
            2
        );
        this.uiScene_ = new THREE.Scene();
        this.sprite_ = new THREE.Sprite(
            new THREE.SpriteMaterial({
                color: 0xffffff,
                fog: false,
                depthTest: false,
                depthWrite: false,
            })
        );
        this.sprite_.scale.set(0.15, 0.15 * this.camera_.aspect, 1);
        this.sprite_.position.set(0, 0, -10);
        this.uiScene_.add(this.sprite_);
    }

    initializeScene_() {
        // Materiais e texturas
        const TextureBox = new THREE.TextureLoader().load('./textures/box.jpg');
        const concreteTexture = new THREE.TextureLoader().load('./textures/Concrete.jpg');
        const concreteMaterial = new THREE.MeshMatcapMaterial({ map: concreteTexture });
        const concreteTextureFloor = new THREE.TextureLoader().load('./textures/ConcreteFloor.jpg');
        const concreteMaterialFloor = new THREE.MeshBasicMaterial({ map: concreteTextureFloor, side: THREE.DoubleSide });

        var geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        var vermelho = new THREE.MeshBasicMaterial({ map: TextureBox, color: 0xff0000 });
        var amarelo = new THREE.MeshBasicMaterial({ color: 0xffff00, map: TextureBox });
        var verde = new THREE.MeshBasicMaterial({ map: TextureBox, color: 0x00ff00 });
        var azul = new THREE.MeshBasicMaterial({ wireframe: true, opacity: 0.01, transparent: true });


        // Layout dos blocos
        const layout = layoutText;
        posZ = 0;
        for (let rua = 0; rua < layout.length; rua = rua + 1) {
            let ultLado = 0;
            var dadorua = layout[rua];
            let andar = dadorua['rua'].max_andares;
            if (dadorua['rua'].max_predios > larguraCd) {
                larguraCd = dadorua['rua'].max_predios;
            }
            var enderecos = dadorua['rua'].enderecos;
            for (let end = 0; end < enderecos.length; end = end + 1) {
                if (ultLado != enderecos[end].lado) {
                    ultLado = enderecos[end].lado;
                    posZ += 4;
                    comprimentoCd = posZ;
                }
                var cor = amarelo;
                if (enderecos[end].cor === 'blq') cor = vermelho;
                if (enderecos[end].cor === 'liv') cor = verde;
                if (enderecos[end].cor === 'sub') cor = azul;
                var cube = new THREE.Mesh(geometry, cor);
                cube.position.x = enderecos[end].posX;
                cube.position.y = enderecos[end].posY;
                cube.position.z = posZ;
                if (enderecos[end].alt != 1 || enderecos[end].larg != 1) {
                    cube.scale.x = enderecos[end].larg;
                    cube.scale.y = enderecos[end].alt;
                }
                this.scene_.add(cube);
                this.clickableMeshes_.push(cube);
                this.collisionBoxes_.push(new THREE.Box3().setFromObject(cube));
            }
            posZ -= 2;
            comprimentoCd = posZ;
        }

        // Chão e paredes
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(larguraCd + 30, comprimentoCd + 20, 10, 10),
            concreteMaterialFloor
        );
        plane.castShadow = false;
        plane.position.set(larguraCd / 2, -0.5, comprimentoCd / 2);
        plane.rotation.x = -Math.PI / 2;
        this.scene_.add(plane);
        this.clickableMeshes_.push(plane);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(plane));

        const plane2 = new THREE.Mesh(
            new THREE.PlaneGeometry(larguraCd + 30, comprimentoCd + 20, 50, 10),
            concreteMaterialFloor
        );
        plane2.castShadow = false;
        plane2.position.set(larguraCd / 2, 25, comprimentoCd / 2);
        plane2.rotation.x = -Math.PI / 2;
        this.scene_.add(plane2);
        this.clickableMeshes_.push(plane2);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(plane2));

        const wall1 = new THREE.Mesh(
            new THREE.BoxGeometry(larguraCd + 30, 50, 1),
            concreteMaterial
        );
        wall1.position.set(larguraCd / 2, 0, -10);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        this.scene_.add(wall1);
        this.clickableMeshes_.push(wall1);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(wall1));

        const wall2 = new THREE.Mesh(
            new THREE.BoxGeometry(larguraCd + 30, 50, 1),
            concreteMaterial
        );
        wall2.position.set(larguraCd / 2, 0, comprimentoCd + 10);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        this.scene_.add(wall2);
        this.clickableMeshes_.push(wall2);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(wall2));

        const wall3 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 50, comprimentoCd + 20),
            concreteMaterial
        );
        wall3.position.set(larguraCd + 15, 0, comprimentoCd / 2);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        this.scene_.add(wall3);
        this.clickableMeshes_.push(wall3);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(wall3));

        const wall4 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 50, comprimentoCd + 20),
            concreteMaterial
        );
        wall4.position.set(-15, 0, comprimentoCd / 2);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        this.scene_.add(wall4);
        this.clickableMeshes_.push(wall4);
        this.collisionBoxes_.push(new THREE.Box3().setFromObject(wall4));
    }

    onWindowResize_() {
        this.camera_.aspect = window.innerWidth / window.innerHeight;
        this.camera_.updateProjectionMatrix();

        this.uiCamera_.left = -this.camera_.aspect;
        this.uiCamera_.right = this.camera_.aspect;
        this.uiCamera_.updateProjectionMatrix();

        this.threejs_.setSize(window.innerWidth, window.innerHeight);
    }

    raf_() {
        requestAnimationFrame((t) => {
            if (this.previousRAF_ === null) {
                this.previousRAF_ = t;
            }

            this.step_(t - this.previousRAF_);
            this.threejs_.autoClear = true;
            this.threejs_.render(this.scene_, this.camera_);
            this.threejs_.autoClear = false;
            this.threejs_.render(this.uiScene_, this.uiCamera_);
            this.previousRAF_ = t;
            this.raf_();
        });
    }

    step_(timeElapsed) {
        const timeElapsedS = timeElapsed * 0.001;
        this.fpsCamera_.update(timeElapsedS);
    }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new FirstPersonCameraDemo();
});

document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        console.log('Pointer locked');
    } else {
        console.log('Pointer unlocked');
    }
});

// Raycaster para clique
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (event) => {
    if (document.pointerLockElement !== document.body) return;
    if (!_APP) return;
    raycaster.setFromCamera(mouse, _APP.camera_);
    const intersects = raycaster.intersectObjects(_APP.clickableMeshes_, false);
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        // Garante que cada bloco tem seu próprio material
        if (obj.material && obj.material.isMaterial && !obj.material._isCloned) {
            obj.material = obj.material.clone();
            obj.material._isCloned = true; // marca para não clonar de novo
        }
        if (obj.material && obj.material.color) {
            const hex = obj.material.color.getHex();
            if (hex === 0xffff00) { // amarelo
                obj.material.color.set(0xff0000); // vira vermelho
            } else if (hex === 0xff0000) { // vermelho
                obj.material.color.set(0x00ff00); // vira verde
            } else if (hex === 0x00ff00) { // verde
                obj.material.color.set(0xffff00); // vira amarelo
            }
        }
        console.log('Cor do bloco alterada!');
    }
});
