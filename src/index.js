import * as THREE from "three"
import * as TWEEN from "tween.js";
import {MeshLine, MeshLineMaterial } from "three.meshline"

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

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
        this._setupModel_box()
        this._setupModel_openLight()
        // this._setupModel_img()
        this._setRenderPass()
        this._setupUnrealBloomPass()
        this._setClickEvent()
        this._setupControls()

        this._openEffect()
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
        const intensity = 0.5
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
        camera.position.z = 10
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
            bloomThreshold: 0.6,
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
    _setupModel_hexa(){
        const hexagonCount = 50
        const hexagonObj = new THREE.Object3D
        hexagonObj.name = "hexagonObj"
        for(let i =0; i< hexagonCount; i++){
            const hexa_geo = new THREE.CircleGeometry(1, 6)
            const hexa_mat = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader2,
                transparent:true,
                uniforms: {
                    opacity:{value: 0},
                    color: { value: {b: 0.3,g: 0.75,r: 0.8} },
                },
            });
            const hexagon = new THREE.Mesh(hexa_geo,hexa_mat)
            let scale_a = ((Math.random() * 20) + 10)/100
            let hexa_scale = [scale_a,scale_a,scale_a]
            hexagon.scale.set(...hexa_scale)
            hexagon.position.x = Math.random() * 0.0005 - 0.00025
            hexagon.position.y = Math.random() * 0.0005 - 0.00025
            hexagon.position.z = Math.random() * 0.0005 - 0.00025
            hexagon.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0)
            hexagonObj.add(hexagon.clone())
        }
        this._hexagonObj = hexagonObj
        this._scene.add(hexagonObj)
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
    _openEffect(){
        let scale = 1
        const eff_update01 = () => {
            scale = scale+100/800
            if(scale>10) {
                this._scene.remove(this._openLightCircleObj)
                cancelAnimationFrame(eff_update01)
                return
            }

            if(scale<5){
                this._openLightCircleObj.scale.y = scale
                this._openLightCircleObj.scale.x = scale/4
            }else{
                this._openLightCircleObj.scale.x = 5/4
                this._openLightCircleObj.scale.y = 10 - scale
            }
            requestAnimationFrame(eff_update01)
        }
        const eff_update02 = (time) => {
            this._hexagonObj.children.forEach( (el, idx) => {
                
                if(idx+1 < this._hexagonObj.children.length){
                    new TWEEN.Tween(el.position)
                    .to({
                        y:Math.random()*20 - 10,
                        x:Math.random()*20 - 10,
                        z:Math.random()*2000 + 100,
                    },2000)
                    .delay(idx*50 + 100)
                    .easing(TWEEN.Easing.Cubic.In)
                    .start()
    
                    new TWEEN.Tween(el.material.uniforms.opacity)
                    .to({value:0.9},300)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .delay(50*idx)
                    .start()
    
                    let scale = 1
                    new TWEEN.Tween(el.scale)
                    .to({x:scale,y:scale,z:scale,},2000)
                    .delay(idx*50 + time)
                    .start()
    
                    new TWEEN.Tween(el.material.uniforms.color.value)
                    .to({b: 0.4,g: 0.8470588235294118,r: 1},1000)
                    .delay(idx*50 + time/2)
                    .start()
                } else {
                    new TWEEN.Tween(el.position)
                    .to({
                        y:0,
                        x:0,
                        z:Math.random()*3 +0,
                    },1500)
                    .delay(idx*100 + 1000)
                    .easing(TWEEN.Easing.Cubic.InOut)
                    .start()
    
                    new TWEEN.Tween(el.material.uniforms.opacity)
                    .to({value:1.0},100)
                    .delay(time + 1500)
                    .start()
    
                    let scale = 20
                    new TWEEN.Tween(el.scale)
                    .to({x:scale,y:scale,z:scale,},1500)
                    .delay(time + 3000)
                    .start()
    
                    new TWEEN.Tween(el.material.uniforms.color.value)
                    .to({
                        b: 0.4,g: 0.8470588235294118,r: 1
                    },1000)
                    .delay(idx*100 + time/2)
                    .start()
                }
            })
        }
        const eff_update03 = () => {
            this._hexagonObj.children.forEach((el)=>{
                new TWEEN.Tween(el.material.uniforms.color.value)
                .to({b: 1,g: 1,r: 1},10)
                .start()
                new TWEEN.Tween(el.material.uniforms.opacity)
                .delay(500)
                .to({value:0},10)
                .start()
                .onComplete(() => {
                    this._scene.remove(this._hexagonObj)
                })
            })
        }
        eff_update01()
        eff_update02(100)
        setTimeout(()=>{
            eff_update03()
        },5000)
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
    }
}

window.onload = function (){
    new App()
}