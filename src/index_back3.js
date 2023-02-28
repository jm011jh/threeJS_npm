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

class App {
    constructor(){
        this._setRenderer()
        this._setScene()
        this._setupLight()
        this._setupCamera()
        this._setRenderPass()
        this._setupUnrealBloomPass()
        this._setupFinalPass()
        this._setupModel4()
        this._setupControls()

        window.onresize = this.resize.bind(this)
        this.resize()

        requestAnimationFrame(this.render.bind(this))
    }
    _setRenderer() {
        const divContainer = document.getElementById("webgl-container")
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
    _setScene() {
        const scene = new THREE.Scene()
        this._scene = scene
    }
    _setRenderPass(){
        const renderPass = new RenderPass(this._scene, this._camera)
        this._renderPass = renderPass
    }
    _setupCamera() {
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight
        const camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            100
        )
        camera.position.z = 2
        this._camera = camera
    }
    _setupLight() {
        const color = 0xffffff
        const intensity = 1
        const light = new THREE.DirectionalLight(color, intensity)
        light.position.set(-1, 2, 4)
        this._scene.add(light)
    }
    _setupControls() {
        new OrbitControls(this._camera, this._divContainer)
    }
    _setupUnrealBloomPass(){
        const bloomComposer = new EffectComposer( this._renderer )
        bloomComposer.renderToScreen = true
        bloomComposer.addPass(this._renderPass)

        const params = {
            exposure: 1.2,
            bloomThreshold: 0.9,
            bloomStrength: 1,
            bloomRadius: 0.6
        };
        const unrealBloomPass = new UnrealBloomPass(new THREE.Vector2(this._divContainer.clientWidth, this._divContainer.clientHeight), 1.5, 0.4, 0.85)
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
    _setupFinalPass(){
        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial( {
              uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: this._bloomComposer.renderTarget2.texture }
              },
              vertexShader: document.getElementById( 'vertexshader' ).textContent,
              fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
              defines: {}
            } ), "baseTexture"
        );
        finalPass.needsSwap = true;
        this._finalPass = finalPass

        const finalComposer = new EffectComposer( this._renderer );
        finalComposer.addPass( this._renderPass );
        finalComposer.addPass( this._finalPass );
        this._finalComposer = finalComposer
          
    }
    _setupModel() {
        const particles = []
        const colors = [
            [1,0,1],
            [1,1,1],
            [0,0,1],
            [1,0,0],
        ]
        const geo_particle = new THREE.PlaneGeometry(1,1)
        const mat_particle = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

        const [rangeMin, rangeMax, gap] = [-10, 10, 10]
        for (let x = rangeMin; x<= rangeMax; x += gap){
            for(let y = rangeMin*2; y<= rangeMax; y += gap){
                for (let z = rangeMin*2; z <= rangeMax; z+= gap){
                    const particle = new THREE.Mesh(geo_particle, mat_particle)
                    particle.position.set(x,y,z)
                    particle.material.color.setRGB(...colors[parseInt(colors.length * Math.random())])
                    this._scene.add(particle)
                    particles.push(particle)
                }
            }
        }
        this._particles = particles

        const geometry = new THREE.BoxGeometry(.5, .5, .5)
        const darkMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        const lightMaterial = new THREE.MeshLambertMaterial({color: 0xffff00});
        this._darkMaterial = darkMaterial
        this._lightMaterial = lightMaterial
        const cube = new THREE.Mesh(geometry, lightMaterial)

        this._scene.add(cube)
        this._cube = cube
    }
    _setupModel2() {
            let points = [];
            points.push( new THREE.Vector3(-50, 0, 0 ) );
            points.push( new THREE.Vector3( 50, 0, 0 ) );
            const line = new MeshLine();
            line.setVertices(points);
            const material = new MeshLineMaterial();
            const mesh = new THREE.Mesh( line, material );
            this._scene.add( mesh );
    }
    _setupModel3() {
        const segmentLength = 1;
        const nbrOfPoints = 5;
        const points = [];
        const turbulence = 0.2;
        for (let i = 0; i < nbrOfPoints; i++) {
          points.push(new THREE.Vector3(
            i * segmentLength,
            (Math.random() * (turbulence * 2)) - turbulence,
            (Math.random() * (turbulence * 2)) - turbulence,
          ));
        }
        const linePoints = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(points).getPoints(100));
        
        // Build the geometry
        const line = new MeshLine();
        line.setGeometry(linePoints );
        const geometry = line.geometry;
        
        // Build the material with good parameters to animate it.
        const material = new MeshLineMaterial({
          transparent: true,
          lineWidth: 0.1,
          color: 0xff0000,
          dashArray: 1.8,     // always has to be the double of the line
          dashOffset: 1,    // start the dash at zero
          dashRatio: 0.75,  // visible length range min: 0.99, max: 0.5
        });
        
        // Build the Mesh
        const lineMesh = new THREE.Mesh(geometry, material);
        lineMesh.position.x = -2;
        // lineMesh.rotation.y = THREE.Math.degToRad(50)
        console.log(lineMesh)
        this._lineMesh = lineMesh
        
        // ! Assuming you have your own webgl engine to add meshes on scene and update them.
        this._scene.add(lineMesh);
    }
    _setupModel4() {
        const lines = []
        const colors = [ '#A0CC33', '#3CEEB5', '#ff0000', "#ed0086", "#0000ff", "#00ff00","#ffffff","#cccccc"]
        const count = 50
        const radius = 10
        const rand = THREE.MathUtils.randFloatSpread
        for(let i = 0; i <= count; i++){

            const pos = new THREE.Vector3(rand(radius),rand(radius),rand(radius))
            const points = Array.from({ length: 7 }, () => pos.add(new THREE.Vector3(rand(radius), rand(radius), rand(radius))).clone())
            const curve = new THREE.CatmullRomCurve3(points).getPoints(200)
            const color_val = colors[parseInt(colors.length * Math.random())]
            const width_val = Math.max(radius/80, (radius / 30) * Math.random())

            const mat_line = new MeshLineMaterial({
                transparent : true,
                lineWidth : width_val,
                color : color_val,
                depthWrite : false,
                dashArray : 0.25,
                dashRatio : 0.9,
                toneMapped : false
            })
            const geom_test = new THREE.BufferGeometry().setFromPoints(curve)
            const line = new MeshLine();
            line.setGeometry(geom_test);
            const geo_line = line.geometry;
            const mesh_line = new THREE.Mesh(geo_line, mat_line);
            lines.push(mesh_line)
            this._scene.add(mesh_line)
        }
        this._lines = lines
    }
    resize() {
        const width = this._divContainer.clientWidth
        const height = this._divContainer.clientHeight

        this._camera.aspect = width / height
        this._camera.updateProjectionMatrix()
        
        this._renderer.setSize(width, height)
        this._bloomComposer.setSize( width, height );
        this._finalComposer.setSize( width, height );
    }
    render(time) {
        // this._renderer.render(this._scene, this._camera)
        this._bloomComposer.render()
        this._finalComposer.render()
        
        this.update(time)
        requestAnimationFrame(this.render.bind(this))
    }
    update(time) {
        time *= 0.001
        for(let line of this._lines){
            const speed = Math.max(0.1, 1* Math.random())
            line.material.dashOffset -= (speed)/500
        }
    }
}

window.onload = function (){
    new App()
}