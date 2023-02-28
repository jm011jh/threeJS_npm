import * as THREE from "three"
import {MeshLine, MeshLineMaterial } from "three.meshline"

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { LuminosityShader } from 'three/addons/shaders/LuminosityShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { MathUtils } from "three";
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
        this._setRenderPass()
        this._setupUnrealBloomPass()
        this._setupControls()
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
    _setScene(){
        const scene = new THREE.Scene()
        scene.background = new THREE.Color().setHSL( 0.51, 0.4, 0.2 );
        this._scene = scene
    }
    _setupLight(){
        const color = 0xffffff
        const intensity = 1
        const light = new THREE.DirectionalLight(color, intensity)
        light.position.set(-1, 2, 10)
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
        camera.position.x = 0.5
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
        sprite.scale.set(2,2,2)
        this._scene.add(sprite)
    }
    _setupModel_box(){
        const geom = new THREE.BoxGeometry(3,3,3)
        const mate = new THREE.MeshPhongMaterial({color:0xff69b4})
        const mesh = new THREE.Mesh(geom,mate)
        this._scene.add(mesh)
    }
    _setupModel_hexa(){
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
            vec2 uv = vUv - 0.5;
            float r = length(uv) * 0.1;
            float a = 1.0 - smoothstep(1.0, 30.0, r);
            gl_FragColor = vec4(color, a * opacity);
          }
        `;
        const hexagonCount = 5
        const hexa_geo = new THREE.CircleGeometry(1, 6)
        const hexa_mat = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader2,
            transparent:true,
            uniforms: {
                opacity:{value: 0.838},
                color: { value: new THREE.Color("#FFA500") },
            },
        });
        const hexagon = new THREE.Mesh(hexa_geo,hexa_mat)
        for(let i =0; i< hexagonCount; i++){
            hexagon.position.x = Math.random() * 10 - 5
            hexagon.position.y = Math.random() * 10 - 5
            hexagon.position.z = Math.random() * 10 - 5
            hexagon.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0)
            hexagon.material.uniforms.opacity.value = 0.88 + 0.0005 * i
            console.log(hexagon.material.uniforms.opacity.value)
            this._scene.add(hexagon.clone())
        }
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