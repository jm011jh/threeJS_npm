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
        this._setupModelGrouping()
        this._setupModel()
        this._setupModel4()
        this._setupModel_sun()
        this._setupModel_hexa()
        this._setupModel_img()
        this._setRenderPass()
        this._setupUnrealBloomPass()
        this._setupFinalPass()
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
        // scene.fog = new THREE.Fog( scene.background, 3500, 15000 );
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
        camera.position.z = 10
        camera.position.x = 0.5
        this._camera = camera
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
            exposure: 1.5,
            bloomThreshold: 0.9,
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
    _setupModel(){
        const particles = []
        const colors = [
            [1,0,1],
            [1,1,1],
            [0,0,1],
            [1,0,0],
        ]
        const geo_particle = new THREE.PlaneGeometry(2,2)
        const mat_particle = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );

        const [rangeMin, rangeMax, gap] = [-10, 10, 10]
        for (let x = rangeMin; x<= rangeMax; x += gap){
            for(let y = rangeMin*2; y<= rangeMax; y += gap){
                for (let z = rangeMin*2; z <= rangeMax; z+= gap){
                    const particle = new THREE.Mesh(geo_particle, mat_particle)
                    // particle.position.set(x/2,y/2,z/2)
                    particle.position.set(x,y,z)
                    particle.material.color.setRGB(...colors[parseInt(colors.length * Math.random())])
                    this._scene.add(particle)
                    particles.push(particle)
                }
            }
        }
        this._particles = particles

        const geometry = new THREE.BoxGeometry(1, 1, 3)
        const darkMaterial = new THREE.MeshBasicMaterial({color: 0x000000});
        const lightMaterial = new THREE.MeshLambertMaterial({color: 0xffff00});
        this._darkMaterial = darkMaterial
        this._lightMaterial = lightMaterial
        const cube = new THREE.Mesh(geometry, lightMaterial)

        this._group1.add(cube)
        this._cube = cube
    }
    _setupModel4(){
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
    _setupModel_sun(){
        const lensflare = new Lensflare();
        const textureLoader = new THREE.TextureLoader()
        const textureFlare0 = textureLoader.load( '../img/lensflare0.png' )
        const textureFlare3 = textureLoader.load( '../img/lensflare3.png' )

        const sunLight = new THREE.DirectionalLight(0xffffff, 1, 10, 2)
            sunLight.position.set(0,-1,0).normalize()
            sunLight.color.setHSL(0.1,0.7,0.5)
            this._sunLight = sunLight

        function addLight(h,s,l,x,y,z){
            const light = new THREE.PointLight(0xffffff,1.5,2000,20)
            light.color.setHSL(h,s,l)
            light.position.set(x,y,z)
            
            const lensflare = new Lensflare()
            lensflare.addElement( new LensflareElement( textureFlare0, 100, 1, light.color))
            lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6))
            lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7))
            lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9))
            lensflare.addElement( new LensflareElement( textureFlare3, 70, 1))
            light.add(lensflare)

            return light
        }
        const lensflareTexture = textureLoader.load("../img/lensflare0.png");
        lensflare.addElement(new LensflareElement(lensflareTexture, 512, 0, new THREE.Color(0xffffff)));

        const geometry = new THREE.SphereGeometry(0.2, 200, 200);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 1,
        });
        this._sun = new THREE.Mesh(geometry, material);
        this._sunLight.add(addLight( 0.08, 0.1, 0.5, 0, 2.3, -10 ))
        this._sun.add(this._sunLight)
        this._scene.add(this._sun)
    }
    _setupModelGrouping(){
        const group1 = new THREE.Group()
        group1.layers.set(1)
        const group2 = new THREE.Group()
        
        this._group1 = group1
        this._group2 = group2
        this._scene.add(this._group1, this._group2)
    }
    _setupModel_flare(){
        const textureLoader = new THREE.TextureLoader()
        const geometry = new THREE.PlaneBufferGeometry(1,1)
        
        const material = new THREE.MeshPhongMaterial({
            map:textureLoader.load('../img/lensflare4.png'),
            side: THREE.DoubleSide,
            bumpMap:textureLoader.load('../img/lensflare4.png'),
        })
        const mesh = new THREE.Mesh(geometry,material)
        this._scene.add(mesh)
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
    _setupModel_hexa(){
        const hexagons = []
        this.hexagons = hexagons
        const hexagonCount = 5
        const hexa_geo = new THREE.CircleGeometry(1, 6)
        const hexa_mat = new THREE.MeshPhysicalMaterial({ 
            color: 0xff9500,
            clearcoat: 0.5,
            clearcoatRoughness: 0.4,
            transparent:true,
            opacity:0.2
          });
        const hexagon = new THREE.Mesh(hexa_geo,hexa_mat)
        for(let i =0; i< hexagonCount; i++){
            hexagon.position.x = Math.random() * 10 - 5
            hexagon.position.y = Math.random() * 10 - 5
            hexagon.position.z = Math.random() * 10 - 5
            hexagon.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0)
            hexagons.push(hexagon.clone())
            this._scene.add(this.hexagons[i])
        }
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
        this._renderer.render(this._scene, this._camera)
        this._bloomComposer.render()
        this._finalComposer.render()
        
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