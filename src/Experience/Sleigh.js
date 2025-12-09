import * as THREE from 'three'
import Experience from './Experience.js'

export default class Sleigh {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    // Animation settings
    this.pathRadius = 18  // Smaller radius to keep sleigh in view
    this.pathHeight = 18
    this.speed = 0.2
    this.animationTime = 0
    this.lastTime = 0

    this.createSleigh()
    this.createSanta()
    this.createBag()
    this.createReindeer()
  }

  createSleigh() {
    this.group = new THREE.Group()

    // Sleigh base/runners - metallic silver
    const runnerMaterial = new THREE.MeshStandardMaterial({
      color: '#c0c0c0',
      roughness: 0.2,
      metalness: 0.9
    })

    // Create curved runners
    const runnerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2, 0, 0),
      new THREE.Vector3(-1, 0.2, 0),
      new THREE.Vector3(1, 0.1, 0),
      new THREE.Vector3(2.5, 0.3, 0),
      new THREE.Vector3(3, 0.5, 0)
    ])

    const runnerGeometry = new THREE.TubeGeometry(runnerCurve, 20, 0.12, 8, false)

    const leftRunner = new THREE.Mesh(runnerGeometry, runnerMaterial)
    leftRunner.position.set(0, 0, 0.9)
    leftRunner.castShadow = true
    this.group.add(leftRunner)

    const rightRunner = new THREE.Mesh(runnerGeometry, runnerMaterial)
    rightRunner.position.set(0, 0, -0.9)
    rightRunner.castShadow = true
    this.group.add(rightRunner)

    // Sleigh body - deep red with better shape
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: '#b22222',
      roughness: 0.5,
      metalness: 0.2
    })

    // Main body - rounded
    const bodyGeometry = new THREE.BoxGeometry(3.5, 1.4, 2)
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0.5, 0.9, 0)
    body.scale.y = 0.7
    body.castShadow = true
    body.receiveShadow = true
    this.group.add(body)

    // Upper body section
    const upperBodyGeometry = new THREE.BoxGeometry(3.2, 0.8, 1.8)
    const upperBody = new THREE.Mesh(upperBodyGeometry, bodyMaterial)
    upperBody.position.set(0.5, 1.5, 0)
    upperBody.castShadow = true
    this.group.add(upperBody)

    // Curved front dashboard - use a curved cylinder segment
    const frontGeometry = new THREE.CylinderGeometry(1.0, 1.0, 1.8, 16, 1, true, Math.PI * 0.5, Math.PI)
    const front = new THREE.Mesh(frontGeometry, bodyMaterial)
    front.position.set(-1.1, 1.2, 0)
    front.rotation.z = Math.PI / 2
    front.castShadow = true
    this.group.add(front)

    // Front cap to close the dashboard
    const frontCapGeometry = new THREE.BoxGeometry(0.15, 1.0, 1.8)
    const frontCap = new THREE.Mesh(frontCapGeometry, bodyMaterial)
    frontCap.position.set(-1.6, 0.9, 0)
    frontCap.castShadow = true
    this.group.add(frontCap)

    // Gold trim details
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      roughness: 0.2,
      metalness: 0.9
    })

    // Trim lines on sleigh body
    const trimGeometry = new THREE.BoxGeometry(3.4, 0.08, 2.1)
    const bottomTrim = new THREE.Mesh(trimGeometry, trimMaterial)
    bottomTrim.position.set(0.5, 0.6, 0)
    this.group.add(bottomTrim)

    const topTrim = new THREE.Mesh(trimGeometry.clone(), trimMaterial)
    topTrim.position.set(0.5, 1.85, 0)
    this.group.add(topTrim)

    // Decorative gold swirls
    const swirlGeometry = new THREE.TorusGeometry(0.15, 0.04, 8, 16)
    for (let i = 0; i < 4; i++) {
      const swirl = new THREE.Mesh(swirlGeometry, trimMaterial)
      swirl.position.set(-0.8 + i * 0.8, 1.5, 1.05)
      swirl.rotation.x = Math.PI / 2
      this.group.add(swirl)

      const swirlBack = swirl.clone()
      swirlBack.position.z = -1.05
      this.group.add(swirlBack)
    }

    // Cross supports
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: '#8b4513',
      roughness: 0.8
    })
    const supportGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8)

    for (let i = 0; i < 3; i++) {
      const support = new THREE.Mesh(supportGeometry, supportMaterial)
      support.position.set(-0.5 + i * 1.5, 0.5, 0.9)
      this.group.add(support)

      const supportRight = support.clone()
      supportRight.position.z = -0.9
      this.group.add(supportRight)
    }

    this.scene.add(this.group)
  }

  createSanta() {
    const santa = new THREE.Group()

    // Body - rounder, jolly shape
    const bodyGeometry = new THREE.SphereGeometry(0.65, 16, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: '#dc143c',
      roughness: 0.7
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.85
    body.scale.set(1, 1.3, 1)
    body.castShadow = true
    santa.add(body)

    // Chest/upper body
    const chestGeometry = new THREE.SphereGeometry(0.55, 16, 16)
    const chest = new THREE.Mesh(chestGeometry, bodyMaterial)
    chest.position.y = 1.4
    chest.scale.set(1, 0.9, 0.9)
    chest.castShadow = true
    santa.add(chest)

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.15, 0.6, 8, 16)
    const leftArm = new THREE.Mesh(armGeometry, bodyMaterial)
    leftArm.position.set(-0.6, 1.3, 0)
    leftArm.rotation.z = 0.5
    leftArm.castShadow = true
    santa.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, bodyMaterial)
    rightArm.position.set(0.6, 1.3, 0)
    rightArm.rotation.z = -0.5
    rightArm.castShadow = true
    santa.add(rightArm)

    // Hands - mittens
    const handMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9
    })
    const handGeometry = new THREE.SphereGeometry(0.12, 8, 8)

    const leftHand = new THREE.Mesh(handGeometry, handMaterial)
    leftHand.position.set(-0.8, 1, 0)
    santa.add(leftHand)

    const rightHand = new THREE.Mesh(handGeometry, handMaterial)
    rightHand.position.set(0.8, 1, 0)
    santa.add(rightHand)

    // Belt
    const beltGeometry = new THREE.TorusGeometry(0.68, 0.1, 8, 32)
    const beltMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.4,
      metalness: 0.3
    })
    const belt = new THREE.Mesh(beltGeometry, beltMaterial)
    belt.position.y = 1.15
    belt.rotation.x = Math.PI / 2
    belt.scale.set(1, 0.9, 1)
    santa.add(belt)

    // Belt buckle - larger, more prominent
    const buckleGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.12)
    const buckleMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      roughness: 0.2,
      metalness: 0.9
    })
    const buckle = new THREE.Mesh(buckleGeometry, buckleMaterial)
    buckle.position.set(0, 1.15, 0.65)
    santa.add(buckle)

    // Buckle details
    const buckleHoleGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.13)
    const buckleHoleMaterial = new THREE.MeshStandardMaterial({
      color: '#b8860b',
      roughness: 0.3
    })
    const buckleHole = new THREE.Mesh(buckleHoleGeometry, buckleHoleMaterial)
    buckleHole.position.set(0, 1.15, 0.66)
    santa.add(buckleHole)

    // Head - larger
    const headGeometry = new THREE.SphereGeometry(0.42, 16, 16)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: '#ffdbcc',
      roughness: 0.9
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 1.95
    head.castShadow = true
    santa.add(head)

    // Nose
    const noseGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: '#ff6b6b',
      roughness: 0.7
    })
    const nose = new THREE.Mesh(noseGeometry, noseMaterial)
    nose.position.set(0, 1.92, 0.42)
    santa.add(nose)

    // Eyes
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a'
    })
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8)

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.12, 2.02, 0.38)
    santa.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.12, 2.02, 0.38)
    santa.add(rightEye)

    // Beard - fuller, fluffier
    const furMaterial = new THREE.MeshStandardMaterial({
      color: '#f8f8f8',
      roughness: 0.95
    })

    const beardMainGeometry = new THREE.SphereGeometry(0.38, 16, 16)
    const beardMain = new THREE.Mesh(beardMainGeometry, furMaterial)
    beardMain.position.set(0, 1.65, 0.25)
    beardMain.scale.set(1.1, 1.4, 0.7)
    santa.add(beardMain)

    // Beard bottom puffs
    const puffGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    for (let i = -1; i <= 1; i++) {
      const puff = new THREE.Mesh(puffGeometry, furMaterial)
      puff.position.set(i * 0.2, 1.35, 0.3)
      puff.scale.set(1, 1.2, 0.8)
      santa.add(puff)
    }

    // Mustache
    const mustacheLeft = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), furMaterial)
    mustacheLeft.position.set(-0.18, 1.88, 0.35)
    mustacheLeft.scale.set(1.3, 0.6, 0.7)
    santa.add(mustacheLeft)

    const mustacheRight = mustacheLeft.clone()
    mustacheRight.position.x = 0.18
    santa.add(mustacheRight)

    // Hat - larger and better shaped
    const hatGeometry = new THREE.ConeGeometry(0.42, 0.8, 16)
    const hatMaterial = new THREE.MeshStandardMaterial({
      color: '#dc143c',
      roughness: 0.7
    })
    const hat = new THREE.Mesh(hatGeometry, hatMaterial)
    hat.position.set(-0.05, 2.35, 0.05)
    hat.rotation.x = 0.15
    hat.rotation.z = 0.1
    hat.castShadow = true
    santa.add(hat)

    // Hat brim/trim
    const hatTrimGeometry = new THREE.TorusGeometry(0.44, 0.12, 8, 32)
    const hatTrim = new THREE.Mesh(hatTrimGeometry, furMaterial)
    hatTrim.position.y = 2.15
    hatTrim.rotation.x = Math.PI / 2
    santa.add(hatTrim)

    // Hat pompom
    const pompomGeometry = new THREE.SphereGeometry(0.15, 12, 12)
    const pompom = new THREE.Mesh(pompomGeometry, furMaterial)
    pompom.position.set(-0.1, 2.65, 0.25)
    santa.add(pompom)

    // Coat trim - white fur on coat
    const coatTrimGeometry = new THREE.TorusGeometry(0.68, 0.08, 8, 32)
    const coatTrimBottom = new THREE.Mesh(coatTrimGeometry, furMaterial)
    coatTrimBottom.position.y = 0.3
    coatTrimBottom.rotation.x = Math.PI / 2
    coatTrimBottom.scale.set(1, 1.1, 1)
    santa.add(coatTrimBottom)

    const coatTrimNeck = new THREE.Mesh(coatTrimGeometry.clone(), furMaterial)
    coatTrimNeck.position.y = 1.75
    coatTrimNeck.rotation.x = Math.PI / 2
    coatTrimNeck.scale.set(0.7, 0.7, 1)
    santa.add(coatTrimNeck)

    // Position Santa in sleigh
    santa.position.set(0.5, 0.6, 0)
    santa.scale.set(1, 1, 1)

    this.santa = santa
    this.group.add(santa)
  }

  createBag() {
    // Gift bag (partially open, hanging off back)
    const bag = new THREE.Group()

    // Bag material - brown burlap/sack texture
    const bagMaterial = new THREE.MeshStandardMaterial({
      color: '#8b6f47',
      roughness: 0.95
    })

    // Main bag body - more realistic sack shape
    const bagGeometry = new THREE.SphereGeometry(1.3, 16, 16)
    const bagMesh = new THREE.Mesh(bagGeometry, bagMaterial)
    bagMesh.scale.set(1, 1.5, 0.95)
    bagMesh.castShadow = true
    bag.add(bagMesh)

    // Bag opening/top - wider opening
    const openingGeometry = new THREE.CylinderGeometry(0.7, 0.8, 0.4, 16)
    const openingMaterial = new THREE.MeshStandardMaterial({
      color: '#6b5639',
      roughness: 0.9
    })
    const opening = new THREE.Mesh(openingGeometry, openingMaterial)
    opening.position.y = 1.5
    bag.add(opening)

    // Rope tie around opening
    const ropeMaterial = new THREE.MeshStandardMaterial({
      color: '#d4a76a',
      roughness: 0.7
    })
    const ropeGeometry = new THREE.TorusGeometry(0.75, 0.08, 8, 16)
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial)
    rope.position.y = 1.4
    rope.rotation.x = Math.PI / 2
    bag.add(rope)

    // Rope knot
    const knotGeometry = new THREE.SphereGeometry(0.15, 8, 8)
    const knot = new THREE.Mesh(knotGeometry, ropeMaterial)
    knot.position.set(0, 1.4, 0.75)
    knot.scale.set(1, 1, 0.6)
    bag.add(knot)

    // Add some bulges to show it's full of gifts
    const bulgeMaterial = new THREE.MeshStandardMaterial({
      color: '#7a5f3d',
      roughness: 0.95
    })

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      const bulge = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8)
      const bulgeMesh = new THREE.Mesh(bulge, bulgeMaterial)
      bulgeMesh.position.set(
        Math.cos(angle) * 0.9,
        -0.3 + Math.random() * 0.6,
        Math.sin(angle) * 0.7
      )
      bag.add(bulgeMesh)
    }

    // Position bag at back of sleigh, tilted as if loosely tied
    bag.position.set(2.2, 1.5, 0)
    bag.rotation.z = -0.4
    bag.rotation.x = 0.3

    this.bag = bag
    this.group.add(bag)

    // Store bag world position for gift spawning
    this.bagWorldPosition = new THREE.Vector3()
  }

  createReindeer() {
    this.reindeerGroup = new THREE.Group()
    this.reindeer = []

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: '#8B4513',
      roughness: 0.8
    })
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.5
    })
    const antlerMaterial = new THREE.MeshStandardMaterial({
      color: '#5c4033',
      roughness: 0.9
    })
    const hoofMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.6
    })

    // Create 8 reindeer in 4 rows of 2
    const rows = 4
    const rowSpacing = 3
    const sideSpacing = 1.8

    for (let row = 0; row < rows; row++) {
      for (let side = 0; side < 2; side++) {
        const reindeer = new THREE.Group()
        const isRudolph = row === 0 && side === 0 // Lead reindeer

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16)
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
        body.rotation.z = Math.PI / 2
        body.position.y = 0.5
        body.castShadow = true
        reindeer.add(body)

        // Neck
        const neckGeometry = new THREE.CapsuleGeometry(0.2, 0.5, 8, 16)
        const neck = new THREE.Mesh(neckGeometry, bodyMaterial)
        neck.position.set(-0.7, 0.8, 0)
        neck.rotation.z = 0.6
        neck.castShadow = true
        reindeer.add(neck)

        // Head
        const headGeometry = new THREE.SphereGeometry(0.28, 12, 12)
        const head = new THREE.Mesh(headGeometry, bodyMaterial)
        head.position.set(-1.0, 1.1, 0)
        head.scale.set(1.2, 1, 1)
        head.castShadow = true
        reindeer.add(head)

        // Snout
        const snoutGeometry = new THREE.CapsuleGeometry(0.12, 0.25, 8, 16)
        const snout = new THREE.Mesh(snoutGeometry, bodyMaterial)
        snout.position.set(-1.35, 1.0, 0)
        snout.rotation.z = Math.PI / 2
        reindeer.add(snout)

        // Nose
        const noseGeometry = new THREE.SphereGeometry(0.08, 8, 8)
        const nose = new THREE.Mesh(noseGeometry, isRudolph ?
          new THREE.MeshStandardMaterial({ color: '#ff0000', emissive: '#ff0000', emissiveIntensity: 0.5 }) :
          noseMaterial)
        nose.position.set(-1.5, 1.0, 0)
        reindeer.add(nose)

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8)
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1a' })
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
        leftEye.position.set(-1.15, 1.2, 0.2)
        reindeer.add(leftEye)
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
        rightEye.position.set(-1.15, 1.2, -0.2)
        reindeer.add(rightEye)

        // Ears
        const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 8)
        const leftEar = new THREE.Mesh(earGeometry, bodyMaterial)
        leftEar.position.set(-0.9, 1.35, 0.2)
        leftEar.rotation.x = -0.3
        leftEar.rotation.z = 0.3
        reindeer.add(leftEar)
        const rightEar = new THREE.Mesh(earGeometry, bodyMaterial)
        rightEar.position.set(-0.9, 1.35, -0.2)
        rightEar.rotation.x = 0.3
        rightEar.rotation.z = 0.3
        reindeer.add(rightEar)

        // Antlers
        this.addAntler(reindeer, antlerMaterial, 0.25)  // Left
        this.addAntler(reindeer, antlerMaterial, -0.25) // Right

        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 8, 16)
        const legPositions = [
          { x: -0.4, z: 0.25 },  // Front left
          { x: -0.4, z: -0.25 }, // Front right
          { x: 0.4, z: 0.25 },   // Back left
          { x: 0.4, z: -0.25 }   // Back right
        ]

        legPositions.forEach((pos, i) => {
          const leg = new THREE.Mesh(legGeometry, bodyMaterial)
          leg.position.set(pos.x, 0.1, pos.z)
          leg.castShadow = true
          reindeer.add(leg)

          // Hoof
          const hoofGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8)
          const hoof = new THREE.Mesh(hoofGeometry, hoofMaterial)
          hoof.position.set(pos.x, -0.2, pos.z)
          reindeer.add(hoof)

          // Store leg reference for animation
          reindeer.userData.legs = reindeer.userData.legs || []
          reindeer.userData.legs.push(leg)
        })

        // Tail
        const tailGeometry = new THREE.SphereGeometry(0.12, 8, 8)
        const tail = new THREE.Mesh(tailGeometry, bodyMaterial)
        tail.position.set(0.8, 0.6, 0)
        tail.scale.set(1, 0.7, 0.7)
        reindeer.add(tail)

        // Position in formation
        const xPos = -4 - row * rowSpacing
        const zPos = (side === 0 ? 1 : -1) * sideSpacing
        reindeer.position.set(xPos, 0, zPos)

        // Store animation offset for leg movement
        reindeer.userData.animOffset = row * 0.5 + side * 0.25

        this.reindeer.push(reindeer)
        this.reindeerGroup.add(reindeer)
      }
    }

    // Add reins connecting reindeer to sleigh
    this.addReins()

    this.group.add(this.reindeerGroup)
  }

  addAntler(reindeer, material, zOffset) {
    const antler = new THREE.Group()

    // Main branch
    const mainGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8)
    const main = new THREE.Mesh(mainGeometry, material)
    main.rotation.z = 0.4
    main.rotation.x = zOffset > 0 ? -0.2 : 0.2
    antler.add(main)

    // First tine
    const tine1Geometry = new THREE.CylinderGeometry(0.02, 0.03, 0.2, 8)
    const tine1 = new THREE.Mesh(tine1Geometry, material)
    tine1.position.set(-0.08, 0.1, zOffset > 0 ? 0.05 : -0.05)
    tine1.rotation.z = 0.8
    antler.add(tine1)

    // Second tine
    const tine2 = new THREE.Mesh(tine1Geometry, material)
    tine2.position.set(-0.12, 0.25, zOffset > 0 ? 0.08 : -0.08)
    tine2.rotation.z = 0.6
    antler.add(tine2)

    antler.position.set(-0.85, 1.35, zOffset)
    reindeer.add(antler)
  }

  addReins() {
    const reinMaterial = new THREE.MeshStandardMaterial({
      color: '#8B0000',
      roughness: 0.6
    })

    // Main reins from sleigh to first row
    const reinGeometry = new THREE.CylinderGeometry(0.03, 0.03, 4.5, 8)

    const leftRein = new THREE.Mesh(reinGeometry, reinMaterial)
    leftRein.position.set(-3.5, 0.8, 1.2)
    leftRein.rotation.z = Math.PI / 2
    leftRein.rotation.y = 0.15
    this.reindeerGroup.add(leftRein)

    const rightRein = new THREE.Mesh(reinGeometry, reinMaterial)
    rightRein.position.set(-3.5, 0.8, -1.2)
    rightRein.rotation.z = Math.PI / 2
    rightRein.rotation.y = -0.15
    this.reindeerGroup.add(rightRein)

    // Cross-bar connecting pairs
    for (let row = 0; row < 4; row++) {
      const barGeometry = new THREE.CylinderGeometry(0.025, 0.025, 3.2, 8)
      const bar = new THREE.Mesh(barGeometry, reinMaterial)
      bar.position.set(-4 - row * 3, 0.7, 0)
      bar.rotation.x = Math.PI / 2
      this.reindeerGroup.add(bar)
    }
  }

  getBagPosition() {
    // Get world position of bag for gift spawning
    this.bag.getWorldPosition(this.bagWorldPosition)
    return this.bagWorldPosition.clone()
  }

  update() {
    const currentTime = this.experience.time.elapsed
    const delta = currentTime - this.lastTime
    this.lastTime = currentTime

    // Check if gift system is paused (gift being hovered)
    const giftSystem = this.experience.world?.giftSystem
    const isPaused = giftSystem?.isPaused || false

    // Only advance animation time when not paused
    if (!isPaused) {
      this.animationTime += delta
    }

    // Circular flight path centered in view
    const angle = this.animationTime * this.speed

    // Circular path that stays within camera view
    const x = Math.cos(angle) * this.pathRadius
    const z = Math.sin(angle) * 12  // Centered z movement

    // Gentle bobbing
    const y = this.pathHeight + Math.sin(this.animationTime * 1.5) * 0.4

    this.group.position.set(x, y, z)

    // Face the direction of travel (tangent to circle)
    this.group.rotation.set(0, -angle + Math.PI / 2, 0)

    // Wobble the bag slightly (only when not paused)
    if (this.bag && !isPaused) {
      this.bag.rotation.z = -0.4 + Math.sin(this.animationTime * 2) * 0.05
      this.bag.rotation.x = 0.3 + Math.sin(this.animationTime * 1.5) * 0.03
    }

    // Animate reindeer legs (galloping motion)
    if (this.reindeer && !isPaused) {
      const legSpeed = 8
      this.reindeer.forEach((reindeer) => {
        const offset = reindeer.userData.animOffset || 0
        const legs = reindeer.userData.legs || []

        legs.forEach((leg, i) => {
          // Front and back legs move in opposite phases
          const phase = i < 2 ? 0 : Math.PI
          // Left and right legs slightly offset
          const sidePhase = i % 2 === 0 ? 0 : Math.PI * 0.5
          const swing = Math.sin(this.animationTime * legSpeed + offset + phase + sidePhase) * 0.3
          leg.rotation.z = swing
        })

        // Subtle body bob
        reindeer.position.y = Math.sin(this.animationTime * legSpeed * 2 + offset) * 0.05
      })
    }
  }
}
