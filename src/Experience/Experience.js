import * as THREE from 'three'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World.js'
import Interaction from './Interaction.js'

export default class Experience {
  static instance

  constructor(options = {}) {
    if (Experience.instance) {
      return Experience.instance
    }
    Experience.instance = this

    this.targetElement = options.targetElement
    if (!this.targetElement) {
      console.warn("Missing 'targetElement' property")
      return
    }

    this.time = { delta: 16, elapsed: 0 }
    this.clock = new THREE.Clock()
    this.targetFPS = 30
    this.frameInterval = 1000 / this.targetFPS
    this.lastFrameTime = 0

    this.setConfig()
    this.setScene()
    this.setCamera()
    this.setRenderer()
    this.setWorld()
    this.setInteraction()
    this.setAudio()

    window.addEventListener('resize', () => this.resize())

    this.update()
  }

  setConfig() {
    this.config = {
      pixelRatio: Math.min(Math.max(window.devicePixelRatio, 1), 2),
      width: this.targetElement.clientWidth,
      height: this.targetElement.clientHeight || window.innerHeight
    }
  }

  setScene() {
    this.scene = new THREE.Scene()
  }

  setCamera() {
    this.camera = new Camera()
  }

  setRenderer() {
    this.renderer = new Renderer()
    this.targetElement.appendChild(this.renderer.instance.domElement)

    // Initialize camera controls now that canvas exists
    this.camera.setControls(this.renderer.instance.domElement)
  }

  setWorld() {
    this.world = new World()
  }

  setInteraction() {
    this.interaction = new Interaction()
  }

  setAudio() {
    // Christmas piano music - Charlie Brown Christmas Medley
    this.music = new Audio('/christmas-music.mp3')
    this.music.loop = true
    this.music.volume = 0.3
    this.musicStarted = false
  }

  playMusic() {
    if (!this.musicStarted && this.music) {
      this.music.play().catch(err => {
        console.log('Audio playback failed:', err)
      })
      this.musicStarted = true
    }
  }

  resize() {
    this.config.width = this.targetElement.clientWidth
    this.config.height = this.targetElement.clientHeight || window.innerHeight
    this.config.pixelRatio = Math.min(Math.max(window.devicePixelRatio, 1), 2)

    this.camera?.resize()
    this.renderer?.resize()
  }

  update(currentTime = 0) {
    requestAnimationFrame((time) => this.update(time))

    const elapsed = currentTime - this.lastFrameTime
    if (elapsed < this.frameInterval) return

    this.lastFrameTime = currentTime - (elapsed % this.frameInterval)

    const delta = this.clock.getDelta()
    this.time.delta = delta * 1000
    this.time.elapsed = this.clock.getElapsedTime()

    this.camera?.update()
    this.world?.update()
    this.renderer?.update()
  }
}
