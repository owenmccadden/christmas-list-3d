import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Experience from './Experience.js'

export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.config = this.experience.config
    this.scene = this.experience.scene

    // Snowglobe settings
    this.domeRadius = 70
    this.isOutside = true
    this.introAnimating = false
    this.introComplete = false
    this.introDuration = 7 // seconds
    this.introStartTime = null

    // Start and end positions for intro
    this.introStart = new THREE.Vector3(0, 100, 250)
    this.introEnd = new THREE.Vector3(0, 15, 45)
    this.introTargetStart = new THREE.Vector3(0, 10, 0)
    this.introTargetEnd = new THREE.Vector3(0, 8, 0)

    this.setInstance()
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      45,
      this.config.width / this.config.height,
      0.1,
      1000
    )

    // Start camera outside the snowglobe
    this.instance.position.copy(this.introStart)
    this.instance.lookAt(this.introTargetStart)

    this.scene.add(this.instance)
  }

  setControls(canvas) {
    this.canvas = canvas
    this.controls = new OrbitControls(this.instance, canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.target.copy(this.introTargetStart)

    // Outside settings - can rotate around the snowglobe
    this.controls.minDistance = 150
    this.controls.maxDistance = 600
    this.controls.maxPolarAngle = Math.PI / 1.5
    this.controls.enabled = true
    this.controls.update()

    // Set up click handler for entering the snowglobe
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    canvas.addEventListener('click', (event) => this.onClick(event))
    canvas.addEventListener('mousemove', (event) => this.onMouseMove(event))

    // Touch support for entering snowglobe on mobile
    canvas.addEventListener('touchend', (event) => {
      if (event.changedTouches.length === 1 && this.isOutside && !this.introAnimating) {
        const touch = event.changedTouches[0]
        this.onTouchEnd(touch)
      }
    })
  }

  onTouchEnd(touch) {
    // Calculate touch position
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast to check if tapping on snowglobe
    this.raycaster.setFromCamera(this.mouse, this.instance)

    const dome = this.experience.world?.environment?.dome
    if (dome) {
      const intersects = this.raycaster.intersectObject(dome)
      if (intersects.length > 0) {
        this.startIntro()
      }
    }
  }

  onMouseMove(event) {
    if (!this.isOutside || this.introAnimating) {
      this.canvas.style.cursor = 'default'
      return
    }

    // Calculate mouse position
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast to check if hovering over snowglobe
    this.raycaster.setFromCamera(this.mouse, this.instance)

    const dome = this.experience.world?.environment?.dome
    if (dome) {
      const intersects = this.raycaster.intersectObject(dome)
      this.canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
    }
  }

  onClick(event) {
    if (!this.isOutside || this.introAnimating) return

    // Calculate mouse position
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast to check if clicking on snowglobe
    this.raycaster.setFromCamera(this.mouse, this.instance)

    const dome = this.experience.world?.environment?.dome
    if (dome) {
      const intersects = this.raycaster.intersectObject(dome)
      if (intersects.length > 0) {
        this.startIntro()
      }
    }
  }

  startIntro() {
    this.introAnimating = true
    this.introStartTime = null
    this.controls.enabled = false

    // Capture current camera position as start point
    this.introStart.copy(this.instance.position)
    this.introTargetStart.copy(this.controls.target)

    // Start background music
    this.experience.playMusic()
  }

  // Easing function for smooth animation
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  resize() {
    this.instance.aspect = this.config.width / this.config.height
    this.instance.updateProjectionMatrix()
  }

  update() {
    const elapsed = this.experience.time.elapsed

    // Handle intro animation (after click)
    if (this.introAnimating && !this.introComplete) {
      if (this.introStartTime === null) {
        this.introStartTime = elapsed
      }

      const introElapsed = elapsed - this.introStartTime
      const progress = Math.min(introElapsed / this.introDuration, 1)
      const easedProgress = this.easeInOutCubic(progress)

      // Interpolate camera position
      this.instance.position.lerpVectors(this.introStart, this.introEnd, easedProgress)

      // Interpolate look target
      const currentTarget = new THREE.Vector3()
      currentTarget.lerpVectors(this.introTargetStart, this.introTargetEnd, easedProgress)
      this.instance.lookAt(currentTarget)

      if (this.controls) {
        this.controls.target.copy(currentTarget)
      }

      if (progress >= 1) {
        this.introComplete = true
        this.introAnimating = false
        this.isOutside = false

        // Switch to inside controls
        if (this.controls) {
          this.controls.minDistance = 10
          this.controls.maxDistance = 60
          this.controls.maxPolarAngle = Math.PI / 2.1
          this.controls.enabled = true
        }

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('enteredGlobe'))
      }
    } else if (this.controls) {
      this.controls.update()
    }
  }
}
