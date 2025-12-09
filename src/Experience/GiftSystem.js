import * as THREE from 'three'
import Experience from './Experience.js'
import giftsData from '../data/gifts.json'

export default class GiftSystem {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.gifts = []
    this.giftMeshes = [] // For raycasting

    // Physics settings - normal speed
    this.gravity = 0.015
    this.groundY = 0.5 // Ground level
    this.bounceDamping = 0.4
    this.friction = 0.95
    this.collisionRadius = 1.2
    this.pushForce = 0.04

    // Spawn settings
    this.spawnInterval = 2.5 // Seconds between gift drops
    this.nextSpawnTime = 5 // Wait for sleigh to be in position
    this.currentGiftIndex = 0
    this.maxGiftsInAir = 8

    // Pause state
    this.isPaused = false
    this.sleigh = null

    this.createGifts()
  }

  createGifts() {
    // Start with initial set of gifts
    const initialGifts = [...giftsData.gifts]

    initialGifts.forEach((giftData, index) => {
      const gift = this.createGift({ ...giftData, id: `${giftData.id}-${index}` }, index)
      this.gifts.push(gift)
      this.giftMeshes.push(gift.mesh)
      gift.group.visible = false
      gift.isActive = false
      gift.isGrounded = false
      this.scene.add(gift.group)
    })
  }

  createGift(data, index) {
    const group = new THREE.Group()

    // Random gift shape variation
    const shapeType = index % 3
    let geometry
    let size = { x: 1, y: 1, z: 1 }

    switch (shapeType) {
      case 0:
        size = { x: 0.8 + Math.random() * 0.4, y: 0.8 + Math.random() * 0.4, z: 0.8 + Math.random() * 0.4 }
        geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
        break
      case 1:
        size = { x: 0.6 + Math.random() * 0.3, y: 1.0 + Math.random() * 0.4, z: 0.6 + Math.random() * 0.3 }
        geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
        break
      case 2:
        size = { x: 1.0 + Math.random() * 0.4, y: 0.6 + Math.random() * 0.3, z: 0.8 + Math.random() * 0.3 }
        geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
        break
    }

    const material = new THREE.MeshStandardMaterial({
      color: data.color || '#c41e3a',
      roughness: 0.4,
      metalness: 0.1
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { isGift: true, giftData: data }

    group.add(mesh)
    this.addRibbon(group, geometry, data)
    this.addBow(group, geometry, data)

    group.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    )

    return {
      group,
      mesh,
      data,
      size,
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ),
      originalScale: 1,
      targetScale: 1,
      isHovered: false,
      isActive: false,
      isGrounded: false
    }
  }

  addRibbon(group, boxGeometry, giftData) {
    const ribbonMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      roughness: 0.3,
      metalness: 0.5
    })

    const params = boxGeometry.parameters

    const hRibbonGeometry = new THREE.BoxGeometry(params.width + 0.05, 0.08, 0.12)
    const hRibbon = new THREE.Mesh(hRibbonGeometry, ribbonMaterial)
    hRibbon.position.y = params.height / 2
    hRibbon.userData = { isGift: true, giftData }
    group.add(hRibbon)

    const vRibbonGeometry = new THREE.BoxGeometry(0.12, 0.08, params.depth + 0.05)
    const vRibbon = new THREE.Mesh(vRibbonGeometry, ribbonMaterial)
    vRibbon.position.y = params.height / 2
    vRibbon.userData = { isGift: true, giftData }
    group.add(vRibbon)
  }

  addBow(group, boxGeometry, giftData) {
    const bowMaterial = new THREE.MeshStandardMaterial({
      color: '#ffd700',
      roughness: 0.3,
      metalness: 0.5
    })

    const params = boxGeometry.parameters
    const bowY = params.height / 2 + 0.1

    const loopGeometry = new THREE.TorusGeometry(0.15, 0.04, 8, 16)

    const leftLoop = new THREE.Mesh(loopGeometry, bowMaterial)
    leftLoop.position.set(-0.12, bowY, 0)
    leftLoop.rotation.y = Math.PI / 4
    leftLoop.rotation.x = Math.PI / 2
    leftLoop.userData = { isGift: true, giftData }
    group.add(leftLoop)

    const rightLoop = new THREE.Mesh(loopGeometry, bowMaterial)
    rightLoop.position.set(0.12, bowY, 0)
    rightLoop.rotation.y = -Math.PI / 4
    rightLoop.rotation.x = Math.PI / 2
    rightLoop.userData = { isGift: true, giftData }
    group.add(rightLoop)

    const centerGeometry = new THREE.SphereGeometry(0.08, 8, 8)
    const center = new THREE.Mesh(centerGeometry, bowMaterial)
    center.position.y = bowY
    center.scale.y = 0.6
    center.userData = { isGift: true, giftData }
    group.add(center)
  }

  spawnGiftFromSleigh(gift) {
    if (!this.sleigh || !this.sleigh.bag) {
      return
    }

    // Use sleigh's proper world position method for accurate bag location
    const bagPos = this.sleigh.getBagPosition()

    // Start gift right at the bag with tiny offset
    gift.group.position.set(
      bagPos.x + (Math.random() - 0.5) * 0.5,
      bagPos.y - 0.5,
      bagPos.z + (Math.random() - 0.5) * 0.5
    )

    // Give gifts a slight downward velocity plus small random spread
    gift.velocity.set(
      (Math.random() - 0.5) * 0.1,
      -0.08 - Math.random() * 0.04,
      (Math.random() - 0.5) * 0.1
    )

    gift.angularVelocity.set(
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.06
    )

    gift.group.visible = true
    gift.isActive = true
    gift.isGrounded = false
  }

  checkCollisions(gift) {
    if (gift.isGrounded) return

    // Check collisions with other gifts
    for (const other of this.gifts) {
      if (other === gift || !other.isActive) continue

      const dx = gift.group.position.x - other.group.position.x
      const dy = gift.group.position.y - other.group.position.y
      const dz = gift.group.position.z - other.group.position.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < this.collisionRadius && dist > 0) {
        // Push apart
        const pushX = (dx / dist) * this.pushForce
        const pushY = (dy / dist) * this.pushForce * 0.5
        const pushZ = (dz / dist) * this.pushForce

        if (!gift.isGrounded) {
          gift.velocity.x += pushX
          gift.velocity.z += pushZ
          if (gift.group.position.y > other.group.position.y) {
            gift.velocity.y += Math.abs(pushY)
          }
        }

        if (!other.isGrounded) {
          other.velocity.x -= pushX
          other.velocity.z -= pushZ
        }

        // Add spin from collision
        gift.angularVelocity.x += (Math.random() - 0.5) * 0.01
        gift.angularVelocity.z += (Math.random() - 0.5) * 0.01
      }
    }
  }

  checkObstacleCollisions(gift) {
    if (gift.isGrounded) return

    const environment = this.experience.world?.environment
    if (!environment || !environment.obstacles) return

    const giftPos = gift.group.position
    const giftRadius = 0.6

    for (const obstacle of environment.obstacles) {
      // Only check if gift is at similar height
      if (giftPos.y < 0.5 || giftPos.y > (obstacle.height || 10)) continue

      if (obstacle.type === 'cylinder') {
        // Tree collision (cylinder)
        const dx = giftPos.x - obstacle.x
        const dz = giftPos.z - obstacle.z
        const dist = Math.sqrt(dx * dx + dz * dz)

        if (dist < obstacle.radius + giftRadius) {
          // Push gift away from tree center
          const pushDist = obstacle.radius + giftRadius - dist
          const angle = Math.atan2(dz, dx)
          gift.group.position.x += Math.cos(angle) * pushDist
          gift.group.position.z += Math.sin(angle) * pushDist

          // Bounce velocity
          gift.velocity.x = Math.cos(angle) * 0.1
          gift.velocity.z = Math.sin(angle) * 0.1
          gift.velocity.y *= 0.5
          gift.angularVelocity.multiplyScalar(1.2)
        }
      } else {
        // House collision (box with rotation)
        // Simple AABB check (not accounting for rotation perfectly, but good enough)
        const halfWidth = (obstacle.width || 4) / 2 + giftRadius
        const halfDepth = (obstacle.depth || 4) / 2 + giftRadius

        const dx = Math.abs(giftPos.x - obstacle.x)
        const dz = Math.abs(giftPos.z - obstacle.z)

        if (dx < halfWidth && dz < halfDepth) {
          // Determine which side to bounce from
          const overlapX = halfWidth - dx
          const overlapZ = halfDepth - dz

          if (overlapX < overlapZ) {
            // Push out on X axis
            gift.group.position.x += (giftPos.x > obstacle.x ? 1 : -1) * overlapX
            gift.velocity.x = (giftPos.x > obstacle.x ? 1 : -1) * 0.15
            gift.velocity.y *= 0.6
          } else {
            // Push out on Z axis
            gift.group.position.z += (giftPos.z > obstacle.z ? 1 : -1) * overlapZ
            gift.velocity.z = (giftPos.z > obstacle.z ? 1 : -1) * 0.15
            gift.velocity.y *= 0.6
          }

          gift.angularVelocity.multiplyScalar(1.3)
        }
      }
    }
  }

  setHovered(gift, isHovered) {
    gift.isHovered = isHovered
    gift.targetScale = isHovered ? 1.15 : 1
    this.isPaused = isHovered
  }

  getGiftMeshes() {
    return this.giftMeshes
  }

  getGiftGroups() {
    return this.gifts.filter(g => g.isActive).map(g => g.group)
  }

  update() {
    const elapsed = this.experience.time.elapsed

    // Get sleigh reference
    if (!this.sleigh) {
      this.sleigh = this.experience.world?.sleigh
    }

    // Don't spawn until sleigh is ready
    if (!this.sleigh || !this.sleigh.bag) {
      return
    }

    // Spawn gifts from the list one at a time (no continuous spawning)
    if (!this.isPaused && elapsed >= this.nextSpawnTime) {
      // Find the next inactive gift to spawn
      const giftToSpawn = this.gifts.find(g => !g.isActive)

      // Only spawn if there are still inactive gifts in the list
      if (giftToSpawn) {
        this.spawnGiftFromSleigh(giftToSpawn)
        this.nextSpawnTime = elapsed + this.spawnInterval
      }
    }

    // Update all active gifts
    for (const gift of this.gifts) {
      if (!gift.isActive) continue

      if (!this.isPaused && !gift.isGrounded) {
        // Apply gravity
        gift.velocity.y -= this.gravity

        // Apply velocity
        gift.group.position.add(gift.velocity)

        // Apply rotation
        gift.group.rotation.x += gift.angularVelocity.x
        gift.group.rotation.y += gift.angularVelocity.y
        gift.group.rotation.z += gift.angularVelocity.z

        // Check collisions with other gifts
        this.checkCollisions(gift)

        // Check collisions with houses and trees
        this.checkObstacleCollisions(gift)

        // Ground collision
        const groundLevel = this.groundY + gift.size.y / 2
        if (gift.group.position.y <= groundLevel) {
          gift.group.position.y = groundLevel

          // Bounce or settle
          if (Math.abs(gift.velocity.y) > 0.01) {
            gift.velocity.y *= -this.bounceDamping
            gift.angularVelocity.multiplyScalar(0.7)
          } else {
            // Settle on ground
            gift.velocity.set(0, 0, 0)
            gift.angularVelocity.multiplyScalar(0.9)

            if (gift.angularVelocity.length() < 0.001) {
              gift.isGrounded = true
              gift.angularVelocity.set(0, 0, 0)
            }
          }

          // Friction on ground
          gift.velocity.x *= this.friction
          gift.velocity.z *= this.friction
        }

        // Keep gifts in bounds
        const bounds = 25
        if (Math.abs(gift.group.position.x) > bounds) {
          gift.group.position.x = Math.sign(gift.group.position.x) * bounds
          gift.velocity.x *= -0.5
        }
        if (Math.abs(gift.group.position.z) > bounds) {
          gift.group.position.z = Math.sign(gift.group.position.z) * bounds
          gift.velocity.z *= -0.5
        }
      }

      // Hover scale (always active)
      const currentScale = gift.group.scale.x
      const newScale = currentScale + (gift.targetScale - currentScale) * 0.1
      gift.group.scale.setScalar(newScale)
    }
  }

  updateGiftData(giftId, newData) {
    const gift = this.gifts.find(g => g.data.id === giftId)
    if (gift) {
      Object.assign(gift.data, newData)
      if (newData.color) {
        gift.mesh.material.color.set(newData.color)
      }
    }
  }

  addGift(giftData) {
    const index = this.gifts.length
    const gift = this.createGift(giftData, index)
    this.gifts.push(gift)
    this.giftMeshes.push(gift.mesh)
    this.scene.add(gift.group)
    return gift
  }

  removeGift(giftId) {
    const index = this.gifts.findIndex(g => g.data.id === giftId)
    if (index !== -1) {
      const gift = this.gifts[index]
      this.scene.remove(gift.group)
      this.gifts.splice(index, 1)
      this.giftMeshes.splice(index, 1)
    }
  }
}
