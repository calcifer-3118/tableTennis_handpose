import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as CANNON from 'cannon-es'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import gsap from 'gsap'
import {Hands} from '@mediapipe/hands'
import {Camera} from '@mediapipe/camera_utils'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
// import {GUI} from 'dat.gui';
// import CannonDebugger from 'cannon-es-debugger'



//Debugging
// const gui = new GUI();

let isMuted = false;
window.play = false;
let models;
let models_duplicate;
let env;
const textures = {}
window.doalert = (checkboxElem)=>{
    if (checkboxElem.checked) {
            document.getElementsByClassName('fas fa-volume-up')[0].style.display = "block";
            document.getElementsByClassName('fas fa-volume-mute')[0].style.display = "none";
            isMuted = false
        } else {
           document.getElementsByClassName('fas fa-volume-mute')[0].style.display = "block";
           document.getElementsByClassName('fas fa-volume-up')[0].style.display = "none";
           isMuted = true
        }
   }     



window.loadHTP = ()=>{
    document.getElementsByClassName('card-container_htp')[0].style.display = 'initial';
}


if(play){
        
        document.getElementsByClassName('card-container_htp')[0].style.display = 'none';
        document.getElementsByClassName('options')[0].style.display = 'none';
    }
    const handDetection = ()=>{
        const videoElement = document.getElementsByClassName('video')[0];
        /**
         * Load Models
         */
        let loaded = false;
        

        const texLoader = new THREE.TextureLoader();
        const loadTextures = (url)=>{
            return texLoader.load(url);
        }
        textures.bowl = loadTextures('models/textures/bowl-min.jpg')
        textures.cabinet = loadTextures('models/textures/cabinet1-min.jpg')
        textures.candle = loadTextures('models/textures/candle-min.jpg')
        textures.carpet = loadTextures('models/textures/CARPET-min.jpg')
        textures.choppingBoard1 = loadTextures('models/textures/CHOPPING_BOARD1-min.jpg')
        textures.choppingBoard2 = loadTextures('models/textures/CHOPPING_BOARD2-min.jpg')
        textures.faucet = loadTextures('models/textures/faucet1-min.jpg')
        textures.floor = loadTextures('models/textures/FLOOR-min.jpg')
        textures.flower = loadTextures('models/textures/FLOWER-min.jpg')
        textures.house = loadTextures('models/textures/house1-min.jpg')
        textures.seat2 = loadTextures('models/textures/IKEA_SEAT2-min.jpg')
        textures.jar1 = loadTextures('models/textures/jar1-min.jpg')
        textures.jar2 = loadTextures('models/textures/jar2-min.jpg')
        textures.jar3 = loadTextures('models/textures/jar3-min.jpg')
        textures.jar4 = loadTextures('models/textures/jar4-min.jpg')
        textures.lighting = loadTextures('models/textures/lighting-min.jpg')
        textures.painting = loadTextures('models/textures/painting1-min.jpg')
        textures.seat1 = loadTextures('models/textures/seat1-min.jpg')
        textures.table = loadTextures('models/textures/TABLE-min.jpg')
        textures.vase = loadTextures('models/textures/vase-min.jpg')
        textures.window = loadTextures('models/textures/window-min.jpg')
     
        //DRACOLoader instance to decode compressed mesh data
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '/' );

        const loader = new GLTFLoader();
        loader.setDRACOLoader( dracoLoader );
        const loadModel = (url) => {
            return new Promise((resolve, reject) => {
                loader.load(url, resolve, null, reject);
            })
        }
        async function load() {

            models = await loadModel('models/scene.glb')
            models_duplicate = await loadModel('models/scene.glb')
            env = await loadModel('models/env.glb')
            if(Object.keys(textures).length == 21) loaded = true;

        }
        load();


        let isExecuted = false;
        let controlRacket;
        function onResults(results) {
            if(loaded && play){
                if(!isExecuted){
                    controlRacket = loadGame();
                    isExecuted = true;
                }
                controlRacket(results);
            }
        }

        const hands = new Hands({locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }});
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        hands.onResults(onResults);

        const camera = new Camera(videoElement, {
          onFrame: async () => {
            await hands.send({image: videoElement});
          },
          width: 350,
          height: 250
        });
        camera.start();
    }

    handDetection();

















    const loadGame = () => {

  
    /**
     * UI
     */
    const modelViewer = document.getElementsByTagName('model-viewer')
    modelViewer[0].style.visibility = 'hidden'

    document.getElementsByClassName('search-box')[0].style.display = 'none'
    document.getElementsByClassName('card-container')[0].style.display = 'none'
    document.getElementsByClassName('score')[0].style.display = 'flex'
    document.getElementsByClassName('card-container_htp')[0].style.display = 'none';
    document.getElementsByClassName('loading')[0].style.display = 'none';
    const pauseMenu = document.getElementsByClassName('card-container_pause')[0];
    const conitnue_btn = document.getElementsByClassName('continue_wrapper')[0];

    
    /**
     * Base
     */
    // Canvas
    const canvas = document.querySelector('canvas.webgl')
    canvas.style.visibility = 'visible'
    
    // Scene
    const scene = new THREE.Scene()
    
   
    /**
     * Physics World
     */
    const world = new CANNON.World()
    world.broadphase = new CANNON.SAPBroadphase(world)
    world.allowSleep = true
    world.gravity.set(0, - 9.82, 0)
    
    // Default material
    const defaultMaterial = new CANNON.Material('default')
    const defaultContactMaterial = new CANNON.ContactMaterial(
        defaultMaterial,
        defaultMaterial,
        {
            friction: 0.1,
            restitution: .9
        }
        )
        world.defaultContactMaterial = defaultContactMaterial
        
        
        /**
         * Player
         */
        class Player {
            constructor(name, score, physicsBody, mesh, hitTable, toServe, won, UI) {
            this.name = name
            this.score = score,
                this.physicsBody = physicsBody,
                this.mesh = mesh,
                this.hitTable = hitTable
                
                this.addScore = () => {
                    if (!executed)
                    this.score += 1
                    executed = true;
                }
            }
    }

    //Initialize Players  
    const p1 = new Player('Player 1', 0)
    const p2 = new Player('AI', 0)

    if(document.getElementsByClassName('search-text')[0].value)
        p1.name = document.getElementsByClassName('search-text')[0].value;
    document.getElementsByClassName('p1_name')[0].innerHTML = p1.name;


    //Get Models
    let ballMesh;
    let tableMesh;
    let animPlaying = false;
    let rak2_animPlaying = false;

    if(models && models_duplicate && env){

        for(let i=0; i<3; i++){
            if(models_duplicate.scene.children[i].name == 'racketglb') p2.mesh = models_duplicate.scene.children[i];
            if(models.scene.children[i].name == 'tableglb') tableMesh = models.scene.children[i]
            else if(models.scene.children[i].name == 'racketglb') p1.mesh = models.scene.children[i]
            else if(models.scene.children[i].name == 'ballglb') ballMesh = models.scene.children[i]
        };

        tableMesh.position.set(3.3, 0 , -1.98);

        //env
        env.scene.traverse((e)=>{
            if(e.isMesh){ 
                e.material = new THREE.MeshBasicMaterial();;
                if(e.name == 'bowl_grey_0') e.material.map = textures.bowl;
                else if(e.name == 'floor_floor_0') e.material.map = textures.floor;
                else if(e.name == 'flower_leaf1_0') e.material.map = textures.flower;
                else if(e.name == 'cabinet_Material015_0') e.material.map = textures.cabinet;
                else if(e.name == 'candle_Material007_0') e.material.map = textures.candle;
                else if(e.name == 'candle_Material013_0') e.material.map = textures.candle;
                else if(e.name == 'chopping_board1_Material1_0') e.material.map = textures.choppingBoard1;
                else if(e.name == 'chopping_board2_Material2_0') e.material.map = textures.choppingBoard2;
                else if(e.name == 'faucet_Material006_0') e.material.map = textures.faucet;
                else if(e.name == 'house_Material009_0') e.material.map = textures.house;
                else if(e.name == 'seat_Leather_0') e.material.map = textures.seat1;
                else if(e.name == 'seat_Material5_0') e.material.map = textures.seat1;
                else if(e.name == 'vase_grey001_0') e.material.map = textures.vase;
                else if(e.name == 'table_Material5001_0') e.material.map = textures.table;
                else if(e.name == 'jar3_Material002_0') e.material.map = textures.jar3;
                else if(e.name == 'jar4_Material017_0') e.material.map = textures.jar4;
                else if(e.name == 'jar1_Material3_0') e.material.map = textures.jar1;
                else if(e.name == 'jar2_Material4_0') e.material.map = textures.jar2;
                else if(e.name == 'painting_Material011_0') e.material.map = textures.painting;
                else if(e.name == 'lighting_Material001_0') e.material.map = textures.lighting;
                else if(e.name == 'window_Material016_0') e.material.map = textures.window;
                else if(e.name == 'carpet_Carpet__0') e.material.map = textures.carpet;
                else if(e.name == 'IKEA_seat_wood__0') e.material.map = textures.seat2;

            }
    
        })

        env.scene.scale.set(2.5, 2.5, 2.5)
        env.scene.position.set(4.23, 0 , 7.3)
        env.scene.rotation.set(0,-89.53,0)
    
        scene.add(p1.mesh, p2.mesh, ballMesh, tableMesh, env.scene)    
    }
    
    
    
    /**
     * Physics
     */
    
    // Cannon.js ballBody
    let lastHit;
    const ballBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0, 3, 0),
        shape: new CANNON.Sphere(.15 / 2),
        material: defaultMaterial
    })
    p2.toServe = true;
    // ballBody.position.set(3.33, 2.588, -1.93)
    world.addBody(ballBody)
    

    const createPlaneBody = (dimensions) => {
        const planeShape = new CANNON.Box(new CANNON.Vec3(dimensions.x, dimensions.y, dimensions.z))
        const planeBody = new CANNON.Body()
        planeBody.mass = 1
        planeBody.addShape(planeShape)
        planeBody.position.set(0, 0, 0)
        world.addBody(planeBody)

        return planeBody;
    }
    
    //Table
    const ground = createPlaneBody({ x: 6.7 / 2, y: 3.6 / 2, z: .1 });
    ground.position.set(3.29, 1.817, -1.97)
    ground.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5)
    
    //TableNet
    const table_net = createPlaneBody({ x: .07 / 2, z: 3.6 / 2, y: .2 });
    table_net.position.set(3.297, 1.983, ground.position.z)
    
    //Racket
    p1.physicsBody = createPlaneBody({ x: .8 / 2 , y: .05 , z: 0.7 / 2 });
    p1.physicsBody.position.set(-0.5, 3, -2)
    p1.physicsBody.quaternion.setFromEuler(0, -((Math.PI / 2)), -.4)
    
    //Opponent Racket
    p2.physicsBody = createPlaneBody({ x: .8 / 2 , y: .05 , z: 0.7 / 2 });
    p2.physicsBody.position.set(7, 3, -2)
    p2.physicsBody.quaternion.setFromEuler(0, Math.PI / 2, 0)
    

    
    
    /**
     * Game Logic
     */
    
    //Physics Debugger
    // const cannonDebugger = new CannonDebugger(scene, world)
    
    let rack_controls = true;
    let time = 0;
    let collision = 0;
    let collision_p2 = 0;
    let gamePaused;

    //difficulty
    let difficulty = document.querySelector('.slider').value / 10; 
    let difficultyInverse;
    const calcDiffInverse = (difficulty)=>{
       difficultyInverse = Math.round((Math.cos((difficulty) * Math.PI / 180)*10) - 0.2);
       if(difficultyInverse<=3)
          difficultyInverse++;
    }
    calcDiffInverse(difficulty)
   
    
    /**
     * Racket Controls
    **/
   let controlRacket;
   if(!gamePaused){
    controlRacket = (results)=>{
        const canvasElement = document.getElementsByClassName('canvas')[0];
        const canvasCtx = canvasElement.getContext('2d');
    
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        canvasCtx.translate(250, 0);
        canvasCtx.scale(-0.9, 0.9);
        
    //   canvasCtx.drawImage(
    //       results.image, 0, 0, canvasElement.width, canvasElement.height);
    
      if (results.multiHandLandmarks) {
    
        if(results.multiHandLandmarks[0]){
            const x = (-results.multiHandLandmarks[0][0].x * 3.5);
            const y = (-results.multiHandLandmarks[0][0].y * 3) + 5;
            let z = (results.multiHandLandmarks[0][0].z * 1000000 * 3 ) - 2;
            
          
            if(z > -0.35 && !p1.toServe) z = -0.4
        
    
            gsap.to(p1.physicsBody.position, { y:y, z:x,  x: z ,  duration:.2, ease:'expo-out'})
            // console.log(p1.physicsBody.position.x)
        }
    
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                         {color: '#47423c', lineWidth: 3});
          drawLandmarks(canvasCtx, landmarks, {color: '#908579', lineWidth: 1});
        }
      }
      canvasCtx.restore();
    }
    

  setInterval(() => {
    time += 0.1;
}, 1000)
    
}

        
    
    //Managing Collisions
    ballBody.addEventListener('collide', (obj) => {
            
        //Collision with tableNet
        if (obj.body.id === table_net.id) {

            lastHit = 'net'
            rack_controls = false;
            if (ballBody.position.z > 3.33)
                respawn(500)
            else
                respawn(500)
        }
        
        //Collision with table
        else if (obj.body.id === ground.id) {
            if (ballBody.position.x > 3.5) {
                collision = 0;

                // Check for Double hit on the same side of the table
                // if(difficulty/10 > 5){
                //     if (!serving) {
                //         collision_p2 += 1
                //         if (collision_p2 >= 2) {
                //             p1.hitTable = false;
                //             p2.hitTable = true;
                //             respawn(300, true, p1, p2)
                //         }
                //     }
                // }

                p1.hitTable = true
                p2.hitTable = false

            }

            else {

                collision_p2 = 0;

                // Check for Double hit on the same side of the table
                // if(difficulty/10 > 5){
                //      if (!serving) {
                //          collision += 1
                //          if (collision >= 2) {
                //              p2.hitTable = false;
                //              p1.hitTable = true;
                //              respawn(300, true, p2, p1)
                //          }
                //      }
                // }

                p2.hitTable = true
                p1.hitTable = false
            }

            //Table-Hit Sound
            if (audio_loaded && !isMuted) {
                tableHitSound.play()
            }
        };

        
        //Checking if controls enabled ==> IMP
        if (rack_controls) {

            //Collision with PlayerRacket
            if (obj.body.id === p1.physicsBody.id) {

                //if PlayerRacket 
                if (!p2.hitTable) {
                    p2.hitTable = true;
                    respawn(300)
                }
                
                //Racket Animations
                animPlaying = true;
                gsap.to(p1.mesh.position, { x: -0.1, duration: .3, ease: 'expo.out' }).eventCallback('onComplete', () => animPlaying = false)
                if (p1.physicsBody.position.z <= ground.position.z)
                    gsap.to(p1.mesh.rotation, { y: -((Math.PI / 2) + .2), duration: .15, ease: 'none' })
                else {
                    gsap.to(p1.mesh.rotation, { y: -((Math.PI / 2) - .6), duration: .15, ease: 'none' })
                }


                //Hit Sound
                if (audio_loaded && !isMuted) hitSound.play()

                //Adding Velocity to the ball ==> IMP
                ballBody.velocity.set(6 + time, 4, (Math.random() - 0.5) * 2.4)
                if (ballBody.position.y <= 2) {
                    ballBody.velocity.y += 2;
                }
            }


            //Collision with OpponentRacket
            else if (obj.body.id === p2.physicsBody.id) {

                //Checking if OpponentRacket 
                if (!p1.hitTable) {
                    p1.hitTable = true;
                    respawn(300)
                }

                //Racket Animation
                rak2_animPlaying = true;
                gsap.to(p2.mesh.position, { x: 6.5, duration: .3, ease: 'expo.out' }).eventCallback('onComplete', () => rak2_animPlaying = false)
                if (p2.physicsBody.position.z <= ground.position.z)
                    gsap.to(p2.mesh.rotation, { y: ((Math.PI / 2) + .2), duration: .15, ease: 'none' })
                else {
                    gsap.to(p2.mesh.rotation, { y: ((Math.PI / 2) - .6), duration: .15, ease: 'none' })
                }


                //Hit Sound
                if (audio_loaded && !isMuted) hitSound.play();

                //Adding Velocity to the Ball ==> IMP
                ballBody.velocity.set(-(6 + time), 4, (Math.random() - 0.5) * 2.4)
                if (ballBody.position.y <= 2) {
                    ballBody.velocity.y += 2;
                }
            }
        
        }
    })


    //Respwaning
    let serving = false;
    const respawn = (delay, doubleHit, scorer, opp) => {
        time = 0;
        serving = true;
        ScoreManager(doubleHit, scorer, opp);
        console.log(`respawning in ${delay}ms`)
        
        setTimeout(() => {
                
            collision = 0;
            collision_p2 = 0;
            ballBody.sleep();

            if (!gamePaused) {
                if (serving) {
            
                    if (p2.toServe) {
                        setTimeout(() => {
                            //serve animation
                            rak2_animPlaying = true;
                            gsap.to(p2.mesh.position, { x: p2.mesh.position.x - 0.8, duration: .3, ease: 'expo.out' }).eventCallback('onComplete', () => rak2_animPlaying = false)
                            if (p2.physicsBody.position.z <= ground.position.z)
                                gsap.to(p2.mesh.rotation, { x: ((Math.PI / 2) + 1), y: ((Math.PI / 2)), duration: .15, ease: 'none' })
                            else {
                                gsap.to(p2.mesh.rotation, { x: ((Math.PI / 2) - 1), y: (-(Math.PI / 2)), duration: .15, ease: 'none' })
                            }
                            //Adding Velocity to ball
                            ballBody.velocity.set(-3, 3, Math.random() - 0.5)
                            defaultContactMaterial.restitution = 1 + Math.random() / 10
                            ballBody.wakeUp()
                            p2.toServe = false;
                            serving = false;
                        }, 1500)
                    }
            
                    //Serve
                    else {
                        if (p1.toServe) {
                           setInterval(()=>{
                            if(!gamePaused){
                               if(p1.physicsBody.position.x >= -0.35 && p1.toServe){
                                   //serve animation
                                   animPlaying = true;
                                   gsap.to(p1.mesh.position, { x: -0.1, duration: .3, ease: 'expo.out' }).eventCallback('onComplete', () => animPlaying = false)
                                   if (p1.physicsBody.position.z <= ground.position.z)
                                       gsap.to(p1.mesh.rotation, { x: ((Math.PI / 2) - 1), z: ((Math.PI / 2)) - 0.2, duration: .15, ease: 'none' })
                                   else {
                                       gsap.to(p1.mesh.rotation, { x: ((Math.PI / 2) - 1), z: (-(Math.PI / 2)) - 1.2, duration: .15, ease: 'none' })
                                   }

                                   ballBody.velocity.set(3, 2, Math.random() - .5)
                                   defaultContactMaterial.restitution = 1 + Math.random() / 10
                                   ballBody.wakeUp()
                                   p1.toServe = false
                                   serving = false
                               }
                            }
                           }, 1200) 
                        }
                    }
                }
            }
            rack_controls = true;
        
        }, delay)

        executed = false
    }

    
    //Scoring
    let executed = false;
    const ScoreManager = (doubleHit, scorer, opp) => {
        if(!doubleHit)
        {
            if (p1.hitTable) {
                p1.addScore();
                p1.toServe = true;
                p2.toServe = false
            }
            else if (p2.hitTable) {
                p2.addScore();
                p2.toServe = true;
                p1.toServe = false;
            }

        }
        else{
            scorer.addScore();
            scorer.toServe = true;
            opp.toServe = false
        }

        setTimeout(() => console.log(p1.score, p2.score), 200)
        
        if (p1.score >= 11) {
            if (p1.score - p2.score >= 2) {
                p1.won = true;
                gameWon(p1)
            }
        }
        else if (p2.score >= 11) {
            if (p2.score - p1.score >= 2) {
                p2.won = true;
                gameWon(p2)
            }
        }

        //Update UI
        const progress_p1 = document.querySelector('.progress-done_p1');
        document.querySelector('.p1_num').innerHTML = p1.score + '&#160 &#160 &#160';
        progress_p1.style.width = p1.score/11 * 100 + '%';
        progress_p1.style.opacity = 1;

        const progress_p2 = document.querySelector('.progress-done_p2');
        document.querySelector('.p2_num').innerHTML = p2.score;
        progress_p2.style.width = p2.score/11 * 100 + '%';
        progress_p2.style.opacity = 1;

    }

    //Stop Game
    let won = false;
    let velocity_before_pause;
    const pauseGame = () => {
        if(!won) pauseMenu.style.display = 'block'
        gamePaused = true;
        velocity_before_pause = JSON.stringify(ballBody.velocity);
        ballBody.sleep();
        document.body.style.cursor = 'default'
    }
    window.mainMenu = ()=> window.location.href="./index.html"
    window.resumeGame = (pos) => {
        pauseMenu.style.display = 'none'
        ballBody.velocity.copy(JSON.parse(velocity_before_pause))
        gamePaused = false;
        ballBody.wakeUp();
        document.body.style.cursor = 'none'
    }
    const gameWon = (winner) => {
        won = true;
        setTimeout(()=> conitnue_btn.style.display = 'flex', 2000)

        controls.autoRotate = true;
        controls.autoRotateSpeed = 2;
        
        const player = document.createElement('lottie-player') 
        player.style = "display: block; width: 300px; height: 300px; z-index: 500; position: absolute; left: 40%; top:-30%";
        player.setAttribute('src', "https://assets8.lottiefiles.com/packages/lf20_bvvejzaz.json")
        player.setAttribute('background', "transparent")
        player.setAttribute('speed', "1")
        player.setAttribute('autoplay', "")

        if(audio_loaded && !isMuted) gameWonSound.play();

        const score = document.getElementsByClassName('score')[0]; 
        score.appendChild(player);

        document.querySelector('.scoreNumber').style.display = 'none'
        document.querySelector('.gameWon').style.display = 'flex'
        document.querySelector('.gameWon_text').innerHTML = `${winner.name} won`
        pauseGame();
        console.log(`game won by:${winner.name}`)
        ballBody.sleep();
    }


    //Pause Game on ESC
    window.addEventListener('keydown', (e) => {
        if (e.keyCode === 27) {
            if (!gamePaused)
                pauseGame();
            else
                resumeGame();
        }
        
    })


    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)
 
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(1024, 1024)
    directionalLight.shadow.camera.far = 15
    directionalLight.shadow.camera.left = - 7
    directionalLight.shadow.camera.top = 7
    directionalLight.shadow.camera.right = 7
    directionalLight.shadow.camera.bottom = - 7
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)
 

    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    }

    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    })

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
    camera.position.z = camera.position.z - 2;
    camera.position.x = camera.position.x - 2.4;
    scene.add(camera)

    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.maxDistance = 6;
    controls.minDistance = 4;
    controls.maxPolarAngle = 1.3089969389957472
    controls.enablePan = false 
    controls.target.set(2.07, 2.64, -2)


    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .6


    /**
     * Audio
     */
    const listener = new THREE.AudioListener();
    camera.add(listener);

    const hitSound = new THREE.Audio(listener);
    const tableHitSound = new THREE.Audio(listener);
    const applauseSound1 = new THREE.Audio(listener);
    const applauseSound2 = new THREE.Audio(listener);
    const applauseSound3 = new THREE.Audio(listener);
    const gameWonSound = new THREE.Audio(listener);

    let audio_loaded;

    const audioLoader = new THREE.AudioLoader();
    const loadAudio = (url, audioClip) => {
        audioLoader.load(url,
            (buffer) => {
                audio_loaded = true;
                audioClip.setBuffer(buffer);
                audioClip.setVolume(0.5);
            });
    }
    
    if(!isMuted){
        loadAudio('sounds/tableHit.mp3', tableHitSound)
        loadAudio('sounds/hit.mp3', hitSound)
        loadAudio(`sounds/applause1.mp3`, applauseSound1)
        loadAudio(`sounds/applause2.mp3`, applauseSound2)
        loadAudio(`sounds/applause3.mp3`, applauseSound3)
        loadAudio(`sounds/winningApplause.wav`, gameWonSound)
    }


    /**
     * Loop
     */
    const clock = new THREE.Clock()
    let oldElapsedTime = 0

    const loop = () => {
        const elapsedTime = clock.getElapsedTime()
        const deltaTime = elapsedTime - oldElapsedTime
        oldElapsedTime = elapsedTime

        
        // Update physics
        world.step(1 / 60, deltaTime, 10)
        if (defaultContactMaterial.restitution >= 1.1)
            defaultContactMaterial.restitution -= 0.1


        //Merging physicsBody with Threejs Mesh
        if (models && models_duplicate && env) {
        
            ballMesh.position.copy(ballBody.position)
            ballMesh.quaternion.copy(ballBody.quaternion)

            if (!animPlaying) {
                p1.mesh.position.copy(p1.physicsBody.position)
                p1.mesh.quaternion.copy(p1.physicsBody.quaternion)
            }

            if (!rak2_animPlaying) {
                p2.mesh.position.copy(p2.physicsBody.position)
                p2.mesh.quaternion.copy(p2.physicsBody.quaternion)
            }
        }

        //Snapping racket rotation
        if (!animPlaying) {
            if (p1.physicsBody.position.z <= ground.position.z)
                p1.physicsBody.quaternion.setFromEuler(((Math.PI / 2)) - .4 , -0.2 , -1.4)
            else
                p1.physicsBody.quaternion.setFromEuler(((Math.PI / 2)) + .4 , -0.2 , -2)
        }
        if (!rak2_animPlaying) {
            if (p2.physicsBody.position.z <= ground.position.z)
                p2.physicsBody.quaternion.setFromEuler(((Math.PI / 2)) - .4 , 0.2 , 1.4)
            else
                p2.physicsBody.quaternion.setFromEuler(((Math.PI / 2)) + .4 , 0.2 , 2)
        }

        //Opponent Racket tracking ball position
        if (ballBody.position.y >= ground.position.y + 0.5) {
            const currPos = ballBody.position;
             gsap.to(p2.physicsBody.position, {
                     y: currPos.y,
                     z: currPos.z,
                     ease: 'out',
                     delay: difficultyInverse / 50
                })
        }
        else if (ballBody.position.y <= -8) {
            
            function randomClip(min , max){
                const numb = Math.floor(Math.random() * (max - min + 1) + min);
                if(numb == 1)
                    applauseSound1.play();
                if(numb == 2)
                    applauseSound2.play();
                if(numb == 3)
                    applauseSound3.play();
            }
            if(!isMuted) randomClip(1,3);
            respawn(300)
        }
   
    
        if (serving) {
                //placing ball at the racket for serve
                if (p1.toServe)
                    ballBody.position.set(p1.physicsBody.position.x + .4, p1.physicsBody.position.y, p1.physicsBody.position.z);
                else if (p2.toServe)
                    ballBody.position.set(p2.physicsBody.position.x - .4, p2.physicsBody.position.y, p2.physicsBody.position.z);
          
                //making sure opponent serves whitin the range of the table
                if (p2.physicsBody.position.z <= -3.6)
                    gsap.to(p2.physicsBody.position, { z: p2.physicsBody.position.z + 1 })
                else if (p2.physicsBody.position.z >= -0.7) {
                    gsap.to(p2.physicsBody.position, { z: p2.physicsBody.position.z - 1 })
                }
        }

        //Physics Debugger Update
        // cannonDebugger.update();


        // Update controls
        controls.update()

        // Render
        renderer.render(scene, camera)

        // Call tick again on the next frame
        window.requestAnimationFrame(loop)
    }

    loop()

    return controlRacket;
    
}
