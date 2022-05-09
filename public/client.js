import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { OBJLoader } from './jsm/loaders/OBJLoader.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import layoutText from './layout.json' assert { type: 'json' };
import { NearestFilter } from 'three';
import { FirstPersonControls } from './jsm/controls/FirstPersonControls.js';

let scene_;
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
    constructor(camera, objects) {
        this.camera_ = camera;
        this.input_ = new InputController();
        this.rotation_ = new THREE.Quaternion();
        this.translation_ = new THREE.Vector3(0, 2, 0);
        this.phi_ = 0;
        this.phiSpeed_ = 8; //movimento da camera para os lados
        this.theta_ = 0;
        this.thetaSpeed_ = 5;
        this.headBobActive_ = false;
        // this.headBobTimer_ = 0;
        this.objects_ = objects;
    }

    update(timeElapsedS) {
        this.updateRotation_(timeElapsedS);
        this.updateCamera_(timeElapsedS);
        this.updateTranslation_(timeElapsedS);
        //this.updateHeadBob_(timeElapsedS);
        this.input_.update(timeElapsedS);
    }

    updateCamera_(_) {
        this.camera_.quaternion.copy(this.rotation_);
        this.camera_.position.copy(this.translation_);
        // this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 1.5;

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.rotation_);

        const dir = forward.clone();

        forward.multiplyScalar(100);
        forward.add(this.translation_);

        let closest = forward;
        const result = new THREE.Vector3();
        const ray = new THREE.Ray(this.translation_, dir);
        for (let i = 0; i < this.objects_.length; ++i) {
            if (ray.intersectBox(this.objects_[i], result)) {
                if (
                    result.distanceTo(ray.origin) <
                    closest.distanceTo(ray.origin)
                ) {
                    closest = result.clone();
                }
            }
        }

        this.camera_.lookAt(closest);
    }

    // updateHeadBob_(timeElapsedS) {
    //     if (this.headBobActive_) {
    //         const wavelength = Math.PI;
    //         const nextStep =
    //             1 +
    //             Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
    //         const nextStepTime = (nextStep * wavelength) / 10;
    //         this.headBobTimer_ = Math.min(
    //             this.headBobTimer_ + timeElapsedS,
    //             nextStepTime
    //         );

    //         if (this.headBobTimer_ == nextStepTime) {
    //             this.headBobActive_ = false;
    //         }
    //     }
    // }

    updateTranslation_(timeElapsedS) {
        const forwardVelocity =
            (this.input_.key(KEYS.w) ? 1 : 0) +
            (this.input_.key(KEYS.s) ? -1 : 0);
        const strafeVelocity =
            (this.input_.key(KEYS.a) ? 1 : 0) +
            (this.input_.key(KEYS.d) ? -1 : 0);

        const qx = new THREE.Quaternion();
        qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(qx);
        forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

        const left = new THREE.Vector3(-1, 0, 0);
        left.applyQuaternion(qx);
        left.multiplyScalar(strafeVelocity * timeElapsedS * 10);

        this.translation_.add(forward);
        this.translation_.add(left);

        // if (forwardVelocity != 0 || strafeVelocity != 0) {
        //     this.headBobActive_ = true;
        //}
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
        this.initialize_();
    }

    initialize_() {
        this.initializeRenderer_();
       // this.initializeLights_();
        this.initializeScene_();
        this.initializePostFX_();
        this.initializeDemo_();

        this.previousRAF_ = null;
        this.raf_();
        this.onWindowResize_();
    }

    initializeDemo_() {
        // this.controls_ = new FirstPersonControls(
        //     this.camera_, this.threejs_.domElement);
        // this.controls_.lookSpeed = 0.8;
        // this.controls_.movementSpeed = 5;

        this.fpsCamera_ = new FirstPersonCamera(this.camera_, this.objects_);
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
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 100.0;
        this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera_.position.set(0, 2, 0);

        this.scene_ = new THREE.Scene();

        const TextureBox = new THREE.TextureLoader().load('./textures/box.jpg');

        var geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        var vermelho = new THREE.MeshBasicMaterial({
            map: TextureBox,
            color: 0xff0000,
            //normalMap: TextureBox,
        });
        var amarelo = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            map: TextureBox,
        });
        var verde = new THREE.MeshBasicMaterial({
            map: TextureBox,
            color: 0x00ff00,
        });

        var azul = new THREE.MeshBasicMaterial({
            //map: TextureBox,
            wireframe: true,
            opacity: 0.01,
            transparent: true
        });

        const layout = layoutText;
        console.log('layout:', layout);
        console.log('layout.lenfsath:', layout.length);

        posZ = 0;

        for (let rua = 0; rua < layout.length; rua = rua + 1) {
            //console.log('rua', rua);
            let ultLado = 0;

            var dadorua = layout[rua];
            //console.log(dadorua);

            let andar = dadorua['rua'].max_andares;

            if (dadorua['rua'].max_predios > larguraCd) {
                larguraCd = dadorua['rua'].max_predios;
            }
            console.log(larguraCd);

            var enderecos = dadorua['rua'].enderecos; //.filter(({lado}) => lado === 1);
            //console.log(enderecos);

            for (let end = 0; end < enderecos.length; end = end + 1) {
                //console.log(enderecos[end]);
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
                    //cube.scale.z = enderecos[end].size;
                }

                this.scene_.add(cube);
            }
            posZ -= 2;
            comprimentoCd = posZ;
        }

        console.log(comprimentoCd);
        //console.log(posZ);

        this.uiCamera_ = new THREE.OrthographicCamera(
            -1,
            1,
            1 * aspect,
            -1 * aspect,
            1,
            2
        );
        this.uiScene_ = new THREE.Scene();
    }

    initializeScene_() {
        
        // const mapLoader = new THREE.TextureLoader();
        // const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();
        // const checkerboard = mapLoader.load('resources/checkerboard.png');
        // checkerboard.anisotropy = maxAnisotropy;
        // checkerboard.wrapS = THREE.RepeatWrapping;
        // checkerboard.wrapT = THREE.RepeatWrapping;
        // checkerboard.repeat.set(32, 32);
        // checkerboard.encoding = THREE.sRGBEncoding;

        const concreteTexture = new THREE.TextureLoader().load(
            './textures/Concrete.jpg'
        );
        const concreteMaterial = new THREE.MeshMatcapMaterial({
            map: concreteTexture,
            //     normalMap: texture,
            // });
        });

        const concreteTextureFloor = new THREE.TextureLoader().load(
            './textures/ConcreteFloor.jpg'
        );
        const concreteMaterialFloor = new THREE.MeshBasicMaterial({
            map: concreteTextureFloor,  side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(
            //largura, comprimento, ?, ?
            new THREE.PlaneGeometry(larguraCd + 30, comprimentoCd + 20, 10, 10),
            concreteMaterialFloor
        );

        plane.castShadow = false;
        plane.position.set(larguraCd / 2, -0.5, comprimentoCd / 2);
        //plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;
        this.scene_.add(plane);

        const plane2 = new THREE.Mesh(
            //largura, comprimento, ?, ?
            new THREE.PlaneGeometry(larguraCd + 30, comprimentoCd + 20, 50, 10),
            concreteMaterialFloor
        );

        plane2.castShadow = false;
        plane2.position.set(larguraCd / 2, 25 , comprimentoCd / 2, );
        //plane.receiveShadow = true;
        plane2.rotation.x = -Math.PI / 2;
        this.scene_.add(plane2);

        const wall1 = new THREE.Mesh(
            new THREE.BoxGeometry(larguraCd + 30, 50, 1),
            concreteMaterial
        );
        wall1.position.set(larguraCd / 2, 0, -10);
        wall1.castShadow = true;
        wall1.receiveShadow = true;
        this.scene_.add(wall1);

        const wall2 = new THREE.Mesh(
            new THREE.BoxGeometry(larguraCd + 30, 50, 1),
            concreteMaterial
        );
        console.log(wall2);
        wall2.position.set(larguraCd / 2, 0, comprimentoCd + 10);
        wall2.castShadow = true;
        wall2.receiveShadow = true;
        this.scene_.add(wall2);

        const wall3 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 50, comprimentoCd + 20),
            concreteMaterial
        );
        wall3.position.set(larguraCd + 15, 0, comprimentoCd / 2);
        wall3.castShadow = true;
        wall3.receiveShadow = true;
        this.scene_.add(wall3);

        const wall4 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 50, comprimentoCd + 20),
            concreteMaterial
        );
        wall4.position.set(-15, 0, comprimentoCd / 2);
        wall4.castShadow = true;
        wall4.receiveShadow = true;
        this.scene_.add(wall4);

        const meshes = [plane, plane2, wall1, wall2, wall3, wall4];

        this.objects_ = [];

        for (let i = 0; i < meshes.length; ++i) {
            const b = new THREE.Box3();
            b.setFromObject(meshes[i]);
            this.objects_.push(b);
        }

        // Crosshair
        //const crosshair = mapLoader.load('./textures/teste.png');
        //crosshair.anisotropy = maxAnisotropy;

        this.sprite_ = new THREE.Sprite(
            new THREE.SpriteMaterial({
                //map: crosshair,
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

    initializeLights_() {
        const distance = 50.0;
        const angle = Math.PI / 4.0;
        const penumbra = 0.5;
        const decay = 1.0;

        let light = new THREE.SpotLight(
            0xffffff,
            100.0,
            distance,
            angle,
            penumbra,
            decay
        );
        light.castShadow = true;
        light.shadow.bias = -0.00001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 1;
        light.shadow.camera.far = 100;

        light.position.set(25, 25, 0);
        light.lookAt(0, 0, 0);
        this.scene_.add(light);

        const upColour = 0xffff80;
        const downColour = 0x808080;
        light = new THREE.HemisphereLight(upColour, downColour, 0.5);
        light.color.setHSL(0.6, 1, 0.6);
        light.groundColor.setHSL(0.095, 1, 0.75);
        light.position.set(0, 4, 0);
        this.scene_.add(light);
    }

    initializePostFX_() {}

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

        // this.controls_.update(timeElapsedS);
        this.fpsCamera_.update(timeElapsedS);
    }
}
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new FirstPersonCameraDemo();
});
