import * as THREE from "three"
import * as TWEEN from "tween.js";
import {MeshLine, MeshLineMaterial } from "three.meshline"

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';

import { LuminosityShader } from 'three/addons/shaders/LuminosityShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { Object3D } from "three";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader2 = `
varying vec2 vUv;
uniform vec3 color;
uniform float opacity;
void main() {
  vec2 uv = vUv - 0.4;
  float r = length(uv) * 0.1;
  float a = 1.0 - smoothstep(1.0, 30.0, r);
  gl_FragColor = vec4(color, a * opacity);
}
`;


class App {
    constructor(){
        this._init()
        window.onresize = this.resize.bind(this)
        this.resize()
        requestAnimationFrame(this.render.bind(this))
    }
    _init(){
        this._setRenderer()
        this._setScene()
        this._setupLight()
        this._setupCamera()
        this._setupModel_hexa()
        // this._setupModel_box()
        this._setupModel_openLight()
        this._setRenderPass()
        this._setupUnrealBloomPass()
        this._setClickEvent()
        this._setupControls()

        this._setupModel_card_effect()

        this._openEffect_glow()
    }
    _setRenderer(){
        const divContainerId = "webgl-container"
        const divContainer = document.getElementById(divContainerId)
        this._divContainer = divContainer

        const renderer = new THREE.WebGLRenderer({
        	powerPreference: "high-performance",
	        antialias: false,
	        stencil: false,
	        depth: false
        })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.toneMappingExposure = 1;
        renderer.toneMapping = THREE.ReinhardToneMapping;
        this._divContainer.appendChild(renderer.domElement)
        this._renderer = renderer
        
    }
    _setClickEvent(){
        this._raycaster = new THREE.Raycaster()
        this._raycaster._clickedPosition = new THREE.Vector2()
        this._raycaster._selectedMesh = null
        window.addEventListener("click", (e) => {
            this._raycaster._clickedPosition.x = (e.clientX/ window.innerWidth) * 2 - 1
            this._raycaster._clickedPosition.y = (e.clientX/ window.innerHeight) * 2 + 1
            this._raycaster.setFromCamera(this._raycaster._clickedPosition, this._camera)
            const found = this._raycaster.intersectObjects(this._scene.children)
            console.log(found)
            if(found.length > 0){
                console.log("hi")
                const clickedObj = found[0].object
                console.log(clickedObj)
            }
        })
    }
    _setScene(){
        const scene = new THREE.Scene()
        scene.background = new THREE.Color().setHSL( 0.51, 0.4, 0.2 );
        this._scene = scene
    }
    _setupLight(){
        const color = 0xffffff
        const intensity = 10
        const light = new THREE.DirectionalLight(color, intensity)
        light.position.set(-1, 2, 3)
        this._scene.add(light)
    }
    _setupCamera(){
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        )
        const camera2 = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        )
        // camera.position.x = Math.PI*4
        // camera.position.y = Math.PI*2
        camera.position.z = 5
        this._camera = camera
        this._camera2 = camera2
    }
    _setRenderPass(){
        const renderPass = new RenderPass(this._scene, this._camera)
        this._renderPass = renderPass
    }
    _setupControls(){
        new OrbitControls(this._camera, this._divContainer)
    }
    _setupUnrealBloomPass(){
        const bloomComposer = new EffectComposer( this._renderer )
        bloomComposer.renderToScreen = true
        bloomComposer.addPass(this._renderPass)

        const params = {
            exposure: 1,
            bloomThreshold: 0.5,
            bloomStrength: 1,
            bloomRadius: 0.6
        };
        const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(this._divContainer.clientWidth, this._divContainer.clientHeight), 1.5, 0.4, 0.85)
        unrealBloomPass.renderToScreen = true;;;
        unrealBloomPass.threshold = params.bloomThreshold
        unrealBloomPass.strength = params.bloomStrength
        unrealBloomPass.radius = params.bloomRadius
        this._unrealBloomPass = unrealBloomPass        
        bloomComposer.addPass(this._unrealBloomPass)
         
        const luminosityPass = new ShaderPass(LuminosityShader)
        this._luminosityPass = luminosityPass
        // bloomComposer.addPass(this._luminosityPass)

        const bloomPass = new BloomPass(1,25,5)
        this._bloomPass = bloomPass
        // bloomComposer.addPass(this._bloomPass)

        const effectCopy = new ShaderPass(CopyShader)
        effectCopy.renderToScreen = true
        this._effectCopy = effectCopy
        bloomComposer.addPass(this._effectCopy)
         
        this._bloomComposer = bloomComposer

    }
    _setupModel_img(){
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load("../img/lensflare4.png")

        const spriteMat = new THREE.SpriteMaterial({map:texture})
        const sprite = new THREE.Sprite(spriteMat)

        sprite.position.set(0,0,-1)
        sprite.scale.set(4,4,4)
        this._scene.add(sprite)
    }
    _setupModel_box(){
        const loader = new FBXLoader()
        const boxObj = new Object3D()
        const url = "../model/chest/chest.fbx"
        boxObj.rotateY(-Math.PI/2)
        boxObj.rotateX(-Math.PI/2)
        boxObj.position.set(0,0,0)
        boxObj.scale.set(2,2,2)
        boxObj.name = "box"
        this._boxObj = boxObj
        this._scene.add(boxObj)
        loader.load(url,(obj) => {
            obj.scale.multiplyScalar(0.01);
            obj.position.set(-1,1,-1)
            obj.traverse( function ( child ) {
                child.userData.root = obj
                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                if ( child.isGroup ) {
                    child.rotation.x = Math.PI;
                    child.rotation.y = Math.PI;
                    child.rotation.z = Math.PI;
                }

            } );
            boxObj.add(obj)
        })
    }
    _setupModel_card_effect(){
        this._clock = new THREE.Clock()
        const loader = new GLTFLoader();
        const url = "../model/effect/card_effect_00.glb"
        loader.load( url,  ( gltf ) => {
            console.log(gltf.animations)
            this._mixer = new THREE.AnimationMixer(gltf.scene)
            const action = this._mixer.clipAction(gltf.animations[0])
            action.setLoop( THREE.LoopOnce );
            action.clampWhenFinished = true;
            // action.enable = true
            action.play()
            gltf.scene.scale.multiplyScalar(5)
        	this._scene.add( gltf.scene );
        }, undefined, ( error ) => {
        	console.error( error );
        } );
    }
    _setupModel_hexa(){
        const hexagonCount = 50
        const hexagonObjs = new THREE.Object3D
        hexagonObjs.name = "hexagonObj"
        for(let i =0; i< hexagonCount; i++){
            const hexagonObj = new THREE.Object3D
            const hexa_geo = new THREE.CircleGeometry(1, 6)
            const hexa_mat = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader2,
                transparent:true,
                uniforms: {
                    opacity:{value: 0},
                    color: { value: {b: .3,g: 0.75,r: 0.8} },
                },
            });
            const hexagon_front = new THREE.Mesh(hexa_geo,hexa_mat)
            const hexagon_back = new THREE.Mesh(hexa_geo,hexa_mat)
            let scale_a = ((Math.random() * 20) + 10)/100
            let pos_x = Math.random() * 0.0005 - 0.00025
            let pos_y = Math.random() * 0.0005 - 0.00025
            let pos_z = Math.random() * 0.0005 - 0.00025
            let multiplyScalerNumber = Math.random() * 2.0 + 1.0
            hexagon_front.scale.set(scale_a,scale_a,scale_a)
            hexagon_front.position.x = pos_x
            hexagon_front.position.y = pos_y
            hexagon_front.position.z = pos_z
            hexagon_front.position.normalize().multiplyScalar(multiplyScalerNumber)
            hexagon_back.scale.set(scale_a,scale_a,scale_a)
            hexagon_back.position.x = pos_x
            hexagon_back.position.y = pos_y
            hexagon_back.position.z = pos_z
            hexagon_back.rotation.x = Math.PI
            hexagon_back.position.normalize().multiplyScalar(multiplyScalerNumber)
            hexagonObj.add(hexagon_front.clone())
            hexagonObj.add(hexagon_back.clone())
            hexagonObjs.add(hexagonObj)
        }
        this._hexagonObjs = hexagonObjs
        this._scene.add(hexagonObjs)
    }
    _setupModel_openLight(){
        const geom = new THREE.CircleGeometry(0.03,200)
        const mate = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader2,
            transparent:true,
            uniforms: {
                opacity:{value: 1},
                color: { value: new THREE.Color("#ffc65d") },
            },
        })
        const openLightCircle = new THREE.Mesh(geom,mate)
              openLightCircle.scale.set(200,1,1)
        const openLightCircleObj = new THREE.Object3D
              openLightCircleObj.add(openLightCircle)
        this._scene.add(openLightCircleObj)
        this._openLightCircleObj = openLightCircleObj
    }
    _openEffect_glow(){
        let degree = 1
        let fast = 5
        /**
         * set the direction hexa objects and open light circle to camera position
         */
        const eff_lookAt = () => {
            const cameraPos = new THREE.Vector3()
            this._camera.getWorldPosition(cameraPos)
            this._hexagonObjs.lookAt(cameraPos)
            this._openLightCircleObj.lookAt(cameraPos)
        }
        /**
         * animation for first horizon light
         */
        const eff_update01 = () => {
            degree = degree+(fast*20)/800
            if(degree>fast*2) {
                this._scene.remove(this._openLightCircleObj)
                cancelAnimationFrame(eff_update01)
                return
            }

            if(degree<fast){
                this._openLightCircleObj.scale.y = degree
                this._openLightCircleObj.scale.x = degree/4
            }else{
                this._openLightCircleObj.scale.y = fast*2 - degree
                this._openLightCircleObj.scale.x = fast/4
            }
            requestAnimationFrame(eff_update01)
        }
        /**
         * animation for hexa polygons(this._hexagonObjs.children)
         * @param {number} delay delay time for appear hexa polygons
         */
        const eff_update02 = (delay) => {
            this._hexagonObjs.children.forEach( (el, idx) => {
                if(idx < this._hexagonObjs.children.length){
                    for(let i = 0; i<el.children.length; i++){
                        let scale = 1
                        let randomX = Math.random()*30 - 15
                        let randomY = Math.random()*20 - 10
                        let randomZ = Math.random()*2000 + 100
                        new TWEEN.Tween(el.children[i].position)
                        .to({x:randomX,y:randomY,z:randomZ},2000)
                        .delay(idx*50 + delay)
                        .easing(TWEEN.Easing.Cubic.In)
                        .start()
        
                        new TWEEN.Tween(el.children[i].material.uniforms.opacity)
                        .to({value:0.9},300)
                        .easing(TWEEN.Easing.Cubic.Out)
                        .delay(50*idx + delay)
                        .start()
        
                        new TWEEN.Tween(el.children[i].scale)
                        .to({x:scale,y:scale,z:scale,},2000)
                        .delay(idx*50 + delay)
                        .start()
        
                        new TWEEN.Tween(el.children[i].material.uniforms.color.value)
                        .to({b: 0.4,g: 0.8470588235294118,r: 1},1000)
                        .delay(idx*50 + delay)
                        .start()
                    }
                }
            })
        }
        /**
         * clear the hexa polygons after animation end
         * @param {number} delay delay time for clear  hexa polygons
         */
        const eff_update03 = (delay) => {
            setTimeout(()=>{
                this._hexagonObjs.children.forEach((el)=>{
                    for(let i = 0; i<el.children.length; i++){
                        new TWEEN.Tween(el.children[i].material.uniforms.color.value)
                        .to({b: 1,g: 1,r: 1},10)
                        .start()
                        new TWEEN.Tween(el.children[i].material.uniforms.opacity)
                        .delay(500)
                        .to({value:0},10)
                        .start()
                        .onComplete(() => { this._scene.remove(this._hexagonObj) })
                    }
                })
            },delay)
        }
        //eff_lookAt()
        eff_update01()
        eff_update02(1000)
        eff_update03(5000)
    }
    resize() {
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight

        this._camera.aspect = width / height
        this._camera.updateProjectionMatrix()
        
        this._renderer.setSize(width, height)
        this._bloomComposer.setSize( width, height );
    }
    render(time) {
        // this._renderer.render(this._scene, this._camera)
        this._bloomComposer.render()
        // this._airglowComposer.render()
        TWEEN.update();
        this.update(time)
        requestAnimationFrame(this.render.bind(this))
    }
    update(time) {
        time *= 0.001
        let y = Math.cos(time) * (30)

        const delta = this._clock.getDelta()
        if(this._mixer) this._mixer.update(delta)
    }
}

window.onload = function (){
    new App()
}