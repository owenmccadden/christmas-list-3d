import * as THREE from 'three'
import Experience from './Experience.js'

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    // Collision obstacles for gifts
    this.obstacles = []

    this.setLights()
    this.setDome()
    this.setMoon()
    this.setStars()
    this.setSnow()
    this.setGround()
    this.setHouses()
    this.setTrees()
  }

  setDome() {
    // Snowglobe dome radius
    this.domeRadius = 70

    // Glass dome (half sphere) - rendered from inside
    const domeGeometry = new THREE.SphereGeometry(this.domeRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    const domeMaterial = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 1,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 0.92,
      thickness: 0.5,
      ior: 1.0, // No refraction distortion
      clearcoat: 0.0,
      reflectivity: 0.0,
      envMapIntensity: 0.0,
      specularIntensity: 0.0,
      attenuationColor: '#e8f4f8',
      attenuationDistance: 100,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    this.dome = new THREE.Mesh(domeGeometry, domeMaterial)
    this.dome.position.y = 0
    this.dome.renderOrder = 1 // Render after opaque objects
    this.scene.add(this.dome)

    // Base/rim of the snowglobe - positioned entirely below ground level
    const baseGeometry = new THREE.CylinderGeometry(this.domeRadius + 2, this.domeRadius + 5, 6, 64)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#4a3728',
      roughness: 0.4,
      metalness: 0.3
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -3.5 // Lower so top is at y=-0.5, below the ground
    this.scene.add(base)

    // Gold trim ring at dome edge
    const trimGeometry = new THREE.TorusGeometry(this.domeRadius + 1, 1, 16, 64)
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      roughness: 0.3,
      metalness: 0.8
    })
    const trim = new THREE.Mesh(trimGeometry, trimMaterial)
    trim.rotation.x = Math.PI / 2
    trim.position.y = -0.5 // Slightly below ground to avoid z-fighting
    this.scene.add(trim)
  }

  setLights() {
    // Ambient light for general illumination - brighter
    this.ambientLight = new THREE.AmbientLight('#6b7a8a', 0.7)
    this.scene.add(this.ambientLight)

    // Moonlight - directional light from moon position - brighter
    this.moonLight = new THREE.DirectionalLight('#e0e8f0', 0.9)
    this.moonLight.position.set(-30, 30, 20)
    this.moonLight.castShadow = true
    this.moonLight.shadow.mapSize.set(1024, 1024)
    this.moonLight.shadow.camera.near = 1
    this.moonLight.shadow.camera.far = 100
    this.moonLight.shadow.camera.left = -30
    this.moonLight.shadow.camera.right = 30
    this.moonLight.shadow.camera.top = 30
    this.moonLight.shadow.camera.bottom = -30
    this.scene.add(this.moonLight)

    // Warm light from house windows
    this.houseLight = new THREE.PointLight('#ffa500', 1.0, 60)
    this.houseLight.position.set(5, 3, 0)
    this.scene.add(this.houseLight)

    // Secondary fill light for better visibility (hemisphere light for soft fill without specular)
    this.fillLight = new THREE.HemisphereLight('#a0c0e0', '#303040', 0.4)
    this.scene.add(this.fillLight)
  }

  setMoon() {
    // Crescent moon painted on the inside of the dome
    const moonGroup = new THREE.Group()

    const outerRadius = 7
    const innerRadius = 5.5
    const innerOffsetX = 3.5 // Offset for nice thick crescent

    // Create crescent using Shape with arcs
    const crescentShape = new THREE.Shape()

    // Outer arc - full left side of moon (the illuminated edge)
    crescentShape.absarc(0, 0, outerRadius, -Math.PI / 2, Math.PI / 2, false)

    // Inner arc - curves back creating the crescent shadow
    crescentShape.absarc(innerOffsetX, 0, innerRadius, Math.PI / 2, -Math.PI / 2, true)

    const moonGeometry = new THREE.ShapeGeometry(crescentShape)
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: '#fffacd',
      side: THREE.FrontSide, // Only visible from inside
      transparent: true,
      opacity: 0.95
    })
    const moon = new THREE.Mesh(moonGeometry, moonMaterial)
    moonGroup.add(moon)

    // Create radial gradient glow using canvas texture
    const glowCenterX = -outerRadius * 0.25
    const glowSize = 256
    const canvas = document.createElement('canvas')
    canvas.width = glowSize
    canvas.height = glowSize
    const ctx = canvas.getContext('2d')

    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      glowSize / 2, glowSize / 2, 0,
      glowSize / 2, glowSize / 2, glowSize / 2
    )
    gradient.addColorStop(0, 'rgba(255, 250, 205, 0.15)')
    gradient.addColorStop(0.3, 'rgba(255, 250, 205, 0.08)')
    gradient.addColorStop(0.6, 'rgba(255, 250, 205, 0.03)')
    gradient.addColorStop(1, 'rgba(255, 250, 205, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, glowSize, glowSize)

    const glowTexture = new THREE.CanvasTexture(canvas)
    const glowGeometry = new THREE.PlaneGeometry(20, 20)
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.set(glowCenterX, 0, -0.2)
    moonGroup.add(glow)

    // Position moon on the inside surface of the dome
    // Place it at the dome radius, angled up and to the left
    const moonAngleH = -0.35 // Horizontal angle (radians) - to the left
    const moonAngleV = 0.45 // Vertical angle - how high up the dome
    const moonDist = this.domeRadius - 0.5 // Just inside the dome surface

    const moonX = Math.sin(moonAngleH) * Math.cos(moonAngleV) * moonDist
    const moonY = Math.sin(moonAngleV) * moonDist
    const moonZ = Math.cos(moonAngleH) * Math.cos(moonAngleV) * moonDist

    moonGroup.position.set(moonX, moonY, -Math.abs(moonZ))
    moonGroup.lookAt(0, moonY * 0.5, 0) // Face toward center of scene

    this.moon = moonGroup
    this.scene.add(this.moon)
  }

  setStars() {
    const starCount = 200
    const positions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 50 + 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 30
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      size: 0.3,
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })

    this.stars = new THREE.Points(geometry, material)
    this.scene.add(this.stars)
  }

  setSnow() {
    this.snowCount = 2000
    const positions = new Float32Array(this.snowCount * 3)
    const velocities = new Float32Array(this.snowCount)
    const maxRadius = this.domeRadius - 10 // Good margin from dome edge

    // Initialize snowflake positions within the hemisphere
    for (let i = 0; i < this.snowCount; i++) {
      // Generate random point inside hemisphere
      const pos = this.randomPointInHemisphere(maxRadius * 0.9)
      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z
      velocities[i] = 0.02 + Math.random() * 0.03
    }

    this.snowGeometry = new THREE.BufferGeometry()
    this.snowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.snowVelocities = velocities

    const snowMaterial = new THREE.PointsMaterial({
      size: 0.3,
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })

    this.snow = new THREE.Points(this.snowGeometry, snowMaterial)
    this.scene.add(this.snow)
  }

  randomPointInHemisphere(radius) {
    // Generate uniform random point inside a hemisphere
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(1 - v) // 0 to PI/2 for upper hemisphere
    const r = radius * Math.cbrt(Math.random()) // Cube root for uniform volume distribution

    return {
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi), // y is up
      z: r * Math.sin(phi) * Math.sin(theta)
    }
  }

  setGround() {
    // Snowy ground plane - solid white, sized to fit inside dome
    const groundGeometry = new THREE.CircleGeometry(this.domeRadius, 64)

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.85,
      metalness: 0.0
    })

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = 0 // Base and trim are now below this level
    this.ground.receiveShadow = true
    this.scene.add(this.ground)
  }

  setHouses() {
    this.houses = new THREE.Group()

    // Naturally scattered houses
    const housePositions = [
      { x: -15, z: 2 },
      { x: 10, z: -3 },
      { x: -4, z: -12 },
      { x: 18, z: 8 },
      { x: -22, z: -8 },
      { x: 5, z: 12 }
    ]

    housePositions.forEach((pos, index) => {
      const houseData = this.createHouse(index)
      houseData.group.position.set(pos.x, 0, pos.z)
      // Slight random rotation for variety
      houseData.group.rotation.y = (Math.random() - 0.5) * 0.4
      this.houses.add(houseData.group)

      // Add collision box
      this.obstacles.push({
        x: pos.x,
        z: pos.z,
        width: houseData.width,
        depth: houseData.depth,
        height: houseData.height,
        rotation: houseData.group.rotation.y
      })

      // Add snowmen to houses 2, 3, 4 (from left to right: indices 0, 2, 5)
      if (index === 0 || index === 2 || index === 5) {
        const snowmenCount = 1 + Math.floor(Math.random() * 2) // 1-2 snowmen
        for (let i = 0; i < snowmenCount; i++) {
          const snowman = this.createSnowman()
          // Position snowmen in front of the house (positive z direction)
          const offsetX = (Math.random() - 0.5) * 4 // Spread along x-axis
          const offsetZ = houseData.depth / 2 + 2 + Math.random() * 2 // 2-4 units in front
          snowman.position.set(pos.x + offsetX, 0, pos.z + offsetZ)
          // Face away from the house
          snowman.rotation.y = 0
          this.houses.add(snowman)
        }
      }
    })

    this.scene.add(this.houses)
  }

  createHouse(index) {
    const house = new THREE.Group()

    // House body
    const bodyWidth = 4 + Math.random() * 2
    const bodyHeight = 3 + Math.random() * 1.5
    const bodyDepth = 4 + Math.random() * 2

    // Wall colors - warm cottage tones
    const wallColors = ['#d4c4a8', '#c9b896', '#e8dcc8', '#b8a888', '#ddd0b8']
    const wallColor = wallColors[index % wallColors.length]

    const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.9
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = bodyHeight / 2
    body.castShadow = true
    body.receiveShadow = true
    house.add(body)

    // Pitched roof using a box rotated, with proper snow coverage
    const roofHeight = 2
    const roofOverhang = 0.5

    // Roof material - dark shingles
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: '#5c4033',
      roughness: 0.9
    })

    // Create triangular prism roof shape
    const roofShape = new THREE.Shape()
    roofShape.moveTo(0, 0)
    roofShape.lineTo(bodyWidth / 2 + roofOverhang, 0)
    roofShape.lineTo(0, roofHeight)
    roofShape.lineTo(-(bodyWidth / 2 + roofOverhang), 0)
    roofShape.lineTo(0, 0)

    const roofExtrudeSettings = {
      depth: bodyDepth + roofOverhang,
      bevelEnabled: false
    }
    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, roofExtrudeSettings)
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.position.set(0, bodyHeight, -(bodyDepth + roofOverhang) / 2)
    roof.castShadow = true
    roof.receiveShadow = true
    house.add(roof)

    // Snow on roof - follows the roof slope
    const snowMaterial = new THREE.MeshStandardMaterial({
      color: '#f8f8ff',
      roughness: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })

    // Snow layer on each side of roof - offset above roof surface
    const snowThickness = 0.2
    const roofAngle = Math.atan2(roofHeight, bodyWidth / 2 + roofOverhang)
    const snowOffset = 0.25 // Offset perpendicular to roof surface

    const snowGeometry = new THREE.BoxGeometry(
      (bodyWidth / 2 + roofOverhang) * 0.95,
      snowThickness,
      bodyDepth + roofOverhang - 0.1
    )

    // Left snow slope - positioned above the roof surface
    const snowLeft = new THREE.Mesh(snowGeometry, snowMaterial)
    snowLeft.rotation.z = roofAngle
    snowLeft.position.set(
      -(bodyWidth / 4 + roofOverhang / 2) * Math.cos(roofAngle) - Math.sin(roofAngle) * snowOffset,
      bodyHeight + roofHeight / 2 + snowThickness / 2 + Math.cos(roofAngle) * snowOffset,
      0
    )
    house.add(snowLeft)

    // Right snow slope
    const snowRight = new THREE.Mesh(snowGeometry, snowMaterial)
    snowRight.rotation.z = -roofAngle
    snowRight.position.set(
      (bodyWidth / 4 + roofOverhang / 2) * Math.cos(roofAngle) + Math.sin(roofAngle) * snowOffset,
      bodyHeight + roofHeight / 2 + snowThickness / 2 + Math.cos(roofAngle) * snowOffset,
      0
    )
    house.add(snowRight)

    // Windows (glowing) - simple planes on the wall surface
    const windowGeometry = new THREE.PlaneGeometry(0.8, 1.0)
    const windowMaterial = new THREE.MeshBasicMaterial({
      color: '#ffcc66'
    })

    const window1 = new THREE.Mesh(windowGeometry, windowMaterial)
    window1.position.set(-bodyWidth * 0.25, bodyHeight / 2, bodyDepth / 2 + 0.02)
    house.add(window1)

    const window2 = new THREE.Mesh(windowGeometry, windowMaterial)
    window2.position.set(bodyWidth * 0.25, bodyHeight / 2, bodyDepth / 2 + 0.02)
    house.add(window2)

    // Door
    const doorGeometry = new THREE.BoxGeometry(1, 1.8, 0.1)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: '#6b3a1f',
      roughness: 0.7
    })
    const door = new THREE.Mesh(doorGeometry, doorMaterial)
    door.position.set(0, 0.9, bodyDepth / 2 + 0.05)
    house.add(door)

    // Chimney
    const chimneyGeometry = new THREE.BoxGeometry(0.8, 2.5, 0.8)
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: '#8b4513',
      roughness: 0.9
    })
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial)
    chimney.position.set(bodyWidth * 0.25, bodyHeight + roofHeight * 0.7, 0)
    chimney.castShadow = true
    house.add(chimney)

    // Snow on chimney top
    const chimneySnow = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.15, 1),
      snowMaterial
    )
    chimneySnow.position.set(bodyWidth * 0.25, bodyHeight + roofHeight * 0.7 + 1.3, 0)
    house.add(chimneySnow)

    // === CHRISTMAS DECORATIONS ===

    // Christmas lights along roof edges (multicolored)
    const lightColors = ['#ff0000', '#00ff00', '#ffff00', '#0088ff', '#ff00ff']
    const lightsGroup = new THREE.Group()

    // Front roof edge lights
    const frontEdgeLength = bodyWidth + roofOverhang * 2
    const lightCount = Math.floor(frontEdgeLength / 0.4)
    for (let i = 0; i < lightCount; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[i % lightColors.length]
      })
      const light = new THREE.Mesh(lightGeometry, lightMaterial)
      const x = -frontEdgeLength / 2 + (i + 0.5) * (frontEdgeLength / lightCount)
      light.position.set(x, bodyHeight + 0.1, bodyDepth / 2 + roofOverhang / 2)
      lightsGroup.add(light)
    }

    // Left roof slope lights
    const slopeLength = Math.sqrt(Math.pow(bodyWidth / 2 + roofOverhang, 2) + Math.pow(roofHeight, 2))
    const slopeLightCount = Math.floor(slopeLength / 0.5)
    for (let i = 0; i < slopeLightCount; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[(i + 2) % lightColors.length]
      })
      const light = new THREE.Mesh(lightGeometry, lightMaterial)
      const t = (i + 0.5) / slopeLightCount
      const x = -(bodyWidth / 2 + roofOverhang) * (1 - t)
      const y = bodyHeight + roofHeight * t + 0.1
      light.position.set(x, y, bodyDepth / 2 + roofOverhang / 2)
      lightsGroup.add(light)
    }

    // Right roof slope lights
    for (let i = 0; i < slopeLightCount; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[(i + 3) % lightColors.length]
      })
      const light = new THREE.Mesh(lightGeometry, lightMaterial)
      const t = (i + 0.5) / slopeLightCount
      const x = (bodyWidth / 2 + roofOverhang) * (1 - t)
      const y = bodyHeight + roofHeight * t + 0.1
      light.position.set(x, y, bodyDepth / 2 + roofOverhang / 2)
      lightsGroup.add(light)
    }

    house.add(lightsGroup)

    // Icicles hanging from roof edges
    const icicleGroup = new THREE.Group()
    const icicleMaterial = new THREE.MeshStandardMaterial({
      color: '#e0f0ff',
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.1
    })

    // Front edge icicles
    const icicleCount = Math.floor(frontEdgeLength / 0.5)
    for (let i = 0; i < icicleCount; i++) {
      const length = 0.15 + Math.random() * 0.25
      const icicleGeometry = new THREE.ConeGeometry(0.04, length, 4)
      const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial)
      const x = -frontEdgeLength / 2 + (i + Math.random() * 0.5) * (frontEdgeLength / icicleCount)
      icicle.position.set(x, bodyHeight, bodyDepth / 2 + roofOverhang / 2)
      icicle.rotation.x = Math.PI
      icicleGroup.add(icicle)
    }

    // Left slope edge icicles
    const slopeIcicleCount = Math.floor(slopeLightCount / 1.5)
    for (let i = 0; i < slopeIcicleCount; i++) {
      const length = 0.1 + Math.random() * 0.2
      const icicleGeometry = new THREE.ConeGeometry(0.03, length, 4)
      const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial)
      const t = (i + Math.random() * 0.5) / slopeIcicleCount
      const x = -(bodyWidth / 2 + roofOverhang) * (1 - t)
      const y = bodyHeight + roofHeight * t - 0.05
      icicle.position.set(x, y, bodyDepth / 2 + roofOverhang / 2)
      icicle.rotation.x = Math.PI
      icicleGroup.add(icicle)
    }

    // Right slope edge icicles
    for (let i = 0; i < slopeIcicleCount; i++) {
      const length = 0.1 + Math.random() * 0.2
      const icicleGeometry = new THREE.ConeGeometry(0.03, length, 4)
      const icicle = new THREE.Mesh(icicleGeometry, icicleMaterial)
      const t = (i + Math.random() * 0.5) / slopeIcicleCount
      const x = (bodyWidth / 2 + roofOverhang) * (1 - t)
      const y = bodyHeight + roofHeight * t - 0.05
      icicle.position.set(x, y, bodyDepth / 2 + roofOverhang / 2)
      icicle.rotation.x = Math.PI
      icicleGroup.add(icicle)
    }

    house.add(icicleGroup)

    // Wreath on door
    const wreathGroup = new THREE.Group()

    // Wreath body (green torus)
    const wreathGeometry = new THREE.TorusGeometry(0.3, 0.08, 8, 16)
    const wreathMaterial = new THREE.MeshStandardMaterial({
      color: '#1a5c1a',
      roughness: 0.8
    })
    const wreath = new THREE.Mesh(wreathGeometry, wreathMaterial)
    wreathGroup.add(wreath)

    // Red bow at bottom of wreath
    const bowGeometry = new THREE.SphereGeometry(0.12, 8, 8)
    bowGeometry.scale(1.5, 0.8, 0.5)
    const bowMaterial = new THREE.MeshStandardMaterial({
      color: '#cc0000',
      roughness: 0.6
    })
    const bow = new THREE.Mesh(bowGeometry, bowMaterial)
    bow.position.set(0, -0.28, 0.05)
    wreathGroup.add(bow)

    // Bow ribbons
    const ribbonGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.03)
    const ribbon1 = new THREE.Mesh(ribbonGeometry, bowMaterial)
    ribbon1.position.set(-0.08, -0.4, 0.05)
    ribbon1.rotation.z = 0.3
    wreathGroup.add(ribbon1)

    const ribbon2 = new THREE.Mesh(ribbonGeometry, bowMaterial)
    ribbon2.position.set(0.08, -0.4, 0.05)
    ribbon2.rotation.z = -0.3
    wreathGroup.add(ribbon2)

    // Small red berries on wreath
    const berryGeometry = new THREE.SphereGeometry(0.04, 6, 6)
    const berryMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000' })
    const berryPositions = [
      { x: 0.25, y: 0.15 }, { x: -0.2, y: 0.2 }, { x: 0.15, y: -0.25 },
      { x: -0.28, y: -0.1 }, { x: 0.28, y: -0.05 }
    ]
    berryPositions.forEach(pos => {
      const berry = new THREE.Mesh(berryGeometry, berryMaterial)
      berry.position.set(pos.x, pos.y, 0.1)
      wreathGroup.add(berry)
    })

    wreathGroup.position.set(0, 1.5, bodyDepth / 2 + 0.12)
    house.add(wreathGroup)

    // Chimney smoke
    const smokeCount = 15
    const smokePositions = new Float32Array(smokeCount * 3)
    const smokeVelocities = new Float32Array(smokeCount)
    const smokeAges = new Float32Array(smokeCount)

    const chimneyX = bodyWidth * 0.25
    const chimneyY = bodyHeight + roofHeight * 0.7 + 1.25
    const chimneyZ = 0

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3] = chimneyX + (Math.random() - 0.5) * 0.3
      smokePositions[i * 3 + 1] = chimneyY + i * 0.4
      smokePositions[i * 3 + 2] = chimneyZ + (Math.random() - 0.5) * 0.3
      smokeVelocities[i] = 0.02 + Math.random() * 0.01
      smokeAges[i] = Math.random() // Random starting age
    }

    const smokeGeometry = new THREE.BufferGeometry()
    smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3))

    const smokeMaterial = new THREE.PointsMaterial({
      size: 0.4,
      color: '#c0c0c0',
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    })

    const smoke = new THREE.Points(smokeGeometry, smokeMaterial)
    house.add(smoke)

    // Store smoke data for animation
    house.userData.smoke = {
      geometry: smokeGeometry,
      velocities: smokeVelocities,
      ages: smokeAges,
      count: smokeCount,
      chimneyPos: { x: chimneyX, y: chimneyY, z: chimneyZ }
    }

    return {
      group: house,
      width: bodyWidth,
      depth: bodyDepth,
      height: bodyHeight + roofHeight
    }
  }

  createSnowman() {
    const snowman = new THREE.Group()

    // Snow material
    const snowMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9
    })

    // Bottom sphere
    const bottomGeometry = new THREE.SphereGeometry(0.6, 16, 16)
    const bottom = new THREE.Mesh(bottomGeometry, snowMaterial)
    bottom.position.y = 0.6
    bottom.castShadow = true
    snowman.add(bottom)

    // Middle sphere
    const middleGeometry = new THREE.SphereGeometry(0.45, 16, 16)
    const middle = new THREE.Mesh(middleGeometry, snowMaterial)
    middle.position.y = 1.4
    middle.castShadow = true
    snowman.add(middle)

    // Top sphere (head)
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const head = new THREE.Mesh(headGeometry, snowMaterial)
    head.position.y = 2.05
    head.castShadow = true
    snowman.add(head)

    // Carrot nose
    const noseMaterial = new THREE.MeshStandardMaterial({ color: '#ff6600' })
    const noseGeometry = new THREE.ConeGeometry(0.05, 0.25, 8)
    const nose = new THREE.Mesh(noseGeometry, noseMaterial)
    nose.position.set(0, 2.05, 0.3)
    nose.rotation.x = Math.PI / 2
    snowman.add(nose)

    // Coal eyes
    const coalMaterial = new THREE.MeshStandardMaterial({ color: '#000000' })
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8)

    const leftEye = new THREE.Mesh(eyeGeometry, coalMaterial)
    leftEye.position.set(-0.1, 2.15, 0.25)
    snowman.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, coalMaterial)
    rightEye.position.set(0.1, 2.15, 0.25)
    snowman.add(rightEye)

    // Coal smile
    const mouthPositions = [
      { x: -0.08, y: 1.92 }, { x: -0.04, y: 1.88 }, { x: 0, y: 1.87 },
      { x: 0.04, y: 1.88 }, { x: 0.08, y: 1.92 }
    ]
    mouthPositions.forEach(pos => {
      const coal = new THREE.Mesh(eyeGeometry, coalMaterial)
      coal.position.set(pos.x, pos.y, 0.25)
      snowman.add(coal)
    })

    // Coal buttons on middle
    const buttonPositions = [1.55, 1.35, 1.15]
    buttonPositions.forEach(y => {
      const button = new THREE.Mesh(eyeGeometry, coalMaterial)
      button.position.set(0, y, 0.42)
      snowman.add(button)
    })

    // Stick arms
    const stickMaterial = new THREE.MeshStandardMaterial({ color: '#4a3728' })
    const armGeometry = new THREE.CylinderGeometry(0.03, 0.025, 0.7, 6)

    const leftArm = new THREE.Mesh(armGeometry, stickMaterial)
    leftArm.position.set(-0.45, 1.4, 0)
    leftArm.rotation.z = Math.PI / 4
    snowman.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, stickMaterial)
    rightArm.position.set(0.45, 1.4, 0)
    rightArm.rotation.z = -Math.PI / 4
    snowman.add(rightArm)

    // Top hat
    const hatBrimGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16)
    const hatMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1a' })
    const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial)
    hatBrim.position.y = 2.35
    hatBrim.castShadow = true
    snowman.add(hatBrim)

    const hatTopGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.4, 16)
    const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial)
    hatTop.position.y = 2.575
    hatTop.castShadow = true
    snowman.add(hatTop)

    // Red hat band
    const bandGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.08, 16)
    const bandMaterial = new THREE.MeshStandardMaterial({ color: '#cc0000' })
    const band = new THREE.Mesh(bandGeometry, bandMaterial)
    band.position.y = 2.4
    snowman.add(band)

    return snowman
  }

  setTrees() {
    this.trees = new THREE.Group()

    const treePositions = []
    const maxRadius = this.domeRadius - 5 // Keep trees inside dome with margin

    // A few trees scattered in the middle area
    const innerTrees = [
      { x: -10, z: -15 },
      { x: 20, z: -12 },
      { x: -25, z: 5 },
      { x: 30, z: 10 },
      { x: -5, z: 20 },
      { x: 8, z: -20 },
      { x: -30, z: -10 }
    ]
    treePositions.push(...innerTrees)

    // Dense forest around the perimeter (inside the dome)
    // Create rings of trees at different radii
    const rings = [
      { radius: 45, count: 35 },
      { radius: 52, count: 40 },
      { radius: 58, count: 45 },
      { radius: 63, count: 50 }
    ]

    rings.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.2
        const r = ring.radius + (Math.random() - 0.5) * 4
        treePositions.push({
          x: Math.cos(angle) * r,
          z: Math.sin(angle) * r
        })
      }
    })

    // Additional scattered trees in mid-range
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = 25 + Math.random() * 20
      treePositions.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r
      })
    }

    // Filter to ensure all trees are within dome
    const validPositions = treePositions.filter(pos => {
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      return dist < maxRadius
    })

    validPositions.forEach(pos => {
      const treeData = this.createTree()
      treeData.group.position.set(pos.x, 0, pos.z)
      this.trees.add(treeData.group)

      // Add collision cylinder for tree
      this.obstacles.push({
        x: pos.x,
        z: pos.z,
        radius: treeData.radius,
        height: treeData.height,
        type: 'cylinder'
      })
    })

    this.scene.add(this.trees)
  }

  createTree() {
    const tree = new THREE.Group()

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: '#4a3728',
      roughness: 0.9
    })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1
    trunk.castShadow = true
    tree.add(trunk)

    // Tree layers (pine tree shape)
    const layers = [
      { y: 2.5, radius: 2, height: 2 },
      { y: 4, radius: 1.5, height: 1.8 },
      { y: 5.2, radius: 1, height: 1.5 }
    ]

    const treeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a472a',
      roughness: 0.8
    })

    layers.forEach(layer => {
      const coneGeometry = new THREE.ConeGeometry(layer.radius, layer.height, 8)
      const cone = new THREE.Mesh(coneGeometry, treeMaterial)
      cone.position.y = layer.y
      cone.castShadow = true
      tree.add(cone)

      // Snow on each layer
      const snowGeometry = new THREE.ConeGeometry(layer.radius * 0.9, 0.2, 8)
      const snowMaterial = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.9
      })
      const snow = new THREE.Mesh(snowGeometry, snowMaterial)
      snow.position.y = layer.y + layer.height / 2 - 0.1
      tree.add(snow)
    })

    // Random scale variation
    const scale = 0.8 + Math.random() * 0.6
    tree.scale.set(scale, scale, scale)

    return {
      group: tree,
      radius: 2 * scale,
      height: 6.5 * scale
    }
  }

  update() {
    // Gentle twinkling stars
    if (this.stars) {
      const time = this.experience.time.elapsed
      this.stars.material.opacity = 0.6 + Math.sin(time * 2) * 0.2
    }

    // Animate chimney smoke
    if (this.houses) {
      const time = this.experience.time.elapsed
      this.houses.children.forEach(house => {
        if (house.userData.smoke) {
          const smokeData = house.userData.smoke
          const positions = smokeData.geometry.attributes.position.array
          const maxAge = 5.0

          for (let i = 0; i < smokeData.count; i++) {
            // Age the particle
            smokeData.ages[i] += 0.016

            // Reset if too old
            if (smokeData.ages[i] > maxAge) {
              smokeData.ages[i] = 0
              positions[i * 3] = smokeData.chimneyPos.x + (Math.random() - 0.5) * 0.3
              positions[i * 3 + 1] = smokeData.chimneyPos.y
              positions[i * 3 + 2] = smokeData.chimneyPos.z + (Math.random() - 0.5) * 0.3
            } else {
              // Rise and drift
              positions[i * 3 + 1] += smokeData.velocities[i]
              positions[i * 3] += Math.sin(time + i) * 0.005
              positions[i * 3 + 2] += Math.cos(time + i) * 0.005
            }
          }

          smokeData.geometry.attributes.position.needsUpdate = true
        }
      })
    }

    // Animate falling snow
    if (this.snow && this.snowGeometry) {
      const positions = this.snowGeometry.attributes.position.array
      const time = this.experience.time.elapsed
      const maxRadius = this.domeRadius - 8 // More margin from dome edge

      for (let i = 0; i < this.snowCount; i++) {
        // Fall down
        positions[i * 3 + 1] -= this.snowVelocities[i]

        // Get current position
        let x = positions[i * 3]
        let y = positions[i * 3 + 1]
        let z = positions[i * 3 + 2]

        // Check distance from center (hemisphere check)
        const distFromCenter = Math.sqrt(x * x + y * y + z * z)

        // Reset if hitting ground
        if (y < 0) {
          const angle = Math.random() * Math.PI * 2
          const spawnHeight = maxRadius * (0.75 + Math.random() * 0.2)
          const maxHorizRadius = Math.sqrt(maxRadius * maxRadius - spawnHeight * spawnHeight) * 0.8
          const horizRadius = Math.random() * maxHorizRadius
          positions[i * 3] = Math.cos(angle) * horizRadius
          positions[i * 3 + 1] = spawnHeight
          positions[i * 3 + 2] = Math.sin(angle) * horizRadius
        }
        // Clamp to stay inside hemisphere
        else if (distFromCenter > maxRadius) {
          const scale = (maxRadius * 0.95) / distFromCenter
          positions[i * 3] = x * scale
          positions[i * 3 + 1] = y * scale
          positions[i * 3 + 2] = z * scale
        }
      }

      this.snowGeometry.attributes.position.needsUpdate = true
    }
  }
}
