import * as THREE from 'three'
import Experience from './Experience.js'

export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene
    this.camera = this.experience.camera

    this.setInstance()
  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      logarithmicDepthBuffer: true
    })

    this.instance.setSize(this.config.width, this.config.height)
    this.instance.setPixelRatio(this.config.pixelRatio)

    // Dark night sky color
    this.instance.setClearColor('#0a0a1a')

    // Enable shadows for depth
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap
  }

  resize() {
    this.instance.setSize(this.config.width, this.config.height)
    this.instance.setPixelRatio(this.config.pixelRatio)
  }

  update() {
    this.instance.render(this.scene, this.camera.instance)
  }
}
