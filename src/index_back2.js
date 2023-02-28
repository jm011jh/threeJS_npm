import * as THREE from "three"
import {MeshLine, MeshLineMaterial } from "three.meshline"

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BloomPass } from 'three/addons/postprocessing/BloomPass.js';
import { LuminosityShader } from 'three/addons/shaders/LuminosityShader.js';
import { FXAAShader } from "three/addons/shaders/FXAAShader.js"
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { MathUtils } from "three";

const vertexShader = `
varying vec2 vUv;

void main() {

    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`
const fragmentShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {

    gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

}
`

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
        this._setupCamera()
        this._setupLight()
        this._setupControls()


        this._setupGroup()
        this._setupModel()
        this._setupModel2()
        this._setupModel3()
        this._renderPassing()
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
        renderer.setClearColor(0x000000)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.toneMappingExposure = 1
        renderer.toneMapping = THREE.ReinhardToneMapping
        this._divContainer.appendChild(renderer.domElement)
        this._renderer = renderer
    }
    _setScene(){
        const scene = new THREE.Scene()
        scene.background = new THREE.Color().setHSL( 0.51, 0.4, 0.1 );
        this._scene = scene
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
        camera.position.z = 10
        camera.position.x = 0.5
        camera.layers.enable(0)
        camera.layers.enable(1)
        camera.layers.enable(2)
        this._camera = camera
    }
    _setupLight(){
        const color = 0xffffff
        const intensity = 1
        const light1 = new THREE.DirectionalLight(color, intensity)
        light1.layers.enable(0)
        light1.layers.enable(1)
        light1.layers.enable(2)
        this._scene.add(light1)

        const light2 = new THREE.AmbientLight(color, 0.3)
        light2.layers.enable(0)
        light2.layers.enable(1)
        light2.layers.enable(2)
        this._scene.add(light2)
    }
    _setupControls(){
        new OrbitControls(this._camera, this._divContainer)
    }
    _setupGroup(){
        const group1 = new THREE.Group()
        this._scene.add(group1)
        this._group1 = group1

        const group2 = new THREE.Group()
        this._scene.add(group2)
        this._group2 = group2
    }
    _setupModel(){
        const geo_box = new THREE.BoxGeometry(2,2,2)
        const mat_box = new THREE.MeshStandardMaterial({
            color:0xffff00,
            emissive:0xffff00,
            emissiveIntensity:1,
        })
        const mes_box = new THREE.Mesh(geo_box,mat_box)
        this._scene.add(mes_box)
        this._cube1 = mes_box

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.9, 0.8);
        const composer = new EffectComposer(this._renderer);
        composer.setSize(this._divContainer.clientWidth, this._divContainer.clientHeight);
        composer.addPass(new RenderPass(this._scene, this._camera));
        composer.addPass(bloomPass);
        mes_box.material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            emissive:0x00ff00,
            emissiveIntensity:1,
        });
        this._renderer.autoClear = false;
        composer.renderTarget2.texture.encoding = THREE.sRGBEncoding
        this._cube1.material.map = composer.renderTarget2.texture;
        this._composer = composer
    }
    _setupModel2(){
        const geo_box = new THREE.BoxGeometry(2,2,2)
        const mat_box = new THREE.MeshBasicMaterial({color:0xff00ff})
        const mes_box = new THREE.Mesh(geo_box,mat_box)
        mes_box.position.y = 3
        this._scene.add(mes_box)
        this._cube2 = mes_box
    }
    _setupModel3(){
        const geo_box = new THREE.BoxGeometry(2,2,2)
        const mat_box = new THREE.MeshBasicMaterial({color:0x00ffff})
        const mes_box = new THREE.Mesh(geo_box,mat_box)
        mes_box.position.y = -3
        this._scene.add(mes_box)
        this._cube3 = mes_box
    }
    _renderPassing(){

        
    }
    resize() {
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight

        this._camera.aspect = width / height
        this._camera.updateProjectionMatrix()
        
        this._renderer.setSize(width, height)
    }
    render(time) {
        this._renderer.render(this._scene, this._camera)
        
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