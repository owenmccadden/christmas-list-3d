import * as THREE from 'three'
import Experience from './Experience.js'

export default class Interaction {
  constructor() {
    this.experience = new Experience()
    this.camera = this.experience.camera
    this.canvas = this.experience.renderer.instance.domElement

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.hoveredGift = null
    this.selectedGift = null // For mobile: the gift whose modal is showing
    this.tooltip = document.getElementById('gift-tooltip')

    // Detect if device supports touch (mobile)
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    this.setupEventListeners()
  }

  setupEventListeners() {
    if (this.isTouchDevice) {
      // Mobile: tap to show modal, tap again to open link
      this.canvas.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
          const touch = event.touches[0]
          // Only handle if we're inside the snowglobe (not during intro)
          const camera = this.experience.camera
          if (camera?.isOutside || camera?.introAnimating) {
            return // Let the touch pass through for snowglobe entry
          }
          this.onTouchTap(touch, event)
        }
      }, { passive: false })

      // Make tooltip clickable on mobile to open link
      if (this.tooltip) {
        this.tooltip.addEventListener('click', () => {
          if (this.selectedGift) {
            this.openGiftLink(this.selectedGift)
          }
        })
      }
    } else {
      // Desktop: hover shows modal, click opens link
      this.canvas.addEventListener('mousemove', (event) => {
        this.onMouseMove(event)
      })

      this.canvas.addEventListener('click', (event) => {
        this.onClick(event)
      })

      // Hide tooltip when mouse leaves
      this.canvas.addEventListener('mouseleave', () => {
        this.hideTooltip()
        if (this.hoveredGift) {
          this.setGiftHovered(this.hoveredGift, false)
          this.hoveredGift = null
        }
      })
    }
  }

  onTouchTap(touch, event) {
    // Calculate normalized device coordinates
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera.instance)

    const giftSystem = this.experience.world?.giftSystem
    if (!giftSystem) return

    // Raycast against all gift groups recursively to catch ribbons and bows
    const giftGroups = giftSystem.getGiftGroups()
    const intersects = this.raycaster.intersectObjects(giftGroups, true)

    if (intersects.length > 0) {
      const intersected = intersects[0].object

      if (intersected.userData.isGift) {
        // Prevent default to stop orbit controls from interfering
        event.preventDefault()

        // Find the main mesh for this gift (for hover effects)
        const mainMesh = this.findMainMesh(intersected, giftSystem)

        if (this.selectedGift === mainMesh) {
          // Second tap on same gift - open the link
          this.openGiftLink(intersected)
        } else {
          // First tap on a gift - show the modal
          // Unhover previous
          if (this.selectedGift) {
            this.setGiftHovered(this.selectedGift, false)
          }

          this.selectedGift = mainMesh
          this.setGiftHovered(mainMesh, true)
          this.showTooltip(intersected.userData.giftData, touch.clientX, touch.clientY)
        }
      }
    } else {
      // Tapped elsewhere - hide modal
      if (this.selectedGift) {
        this.setGiftHovered(this.selectedGift, false)
        this.selectedGift = null
        this.hideTooltip()
      }
    }
  }

  findMainMesh(hitObject, giftSystem) {
    // Find the main mesh that corresponds to this gift
    const giftData = hitObject.userData.giftData
    const gift = giftSystem.gifts.find(g => g.data === giftData || g.data.id === giftData?.id)
    return gift ? gift.mesh : hitObject
  }

  onMouseMove(event) {
    // Calculate normalized device coordinates
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera.instance)

    const giftSystem = this.experience.world?.giftSystem
    if (!giftSystem) return

    // Raycast against all gift groups recursively to catch ribbons and bows
    const giftGroups = giftSystem.getGiftGroups()
    const intersects = this.raycaster.intersectObjects(giftGroups, true)

    if (intersects.length > 0) {
      const intersected = intersects[0].object

      if (intersected.userData.isGift) {
        // Find the main mesh for this gift (for hover effects)
        const mainMesh = this.findMainMesh(intersected, giftSystem)

        // New gift hovered
        if (this.hoveredGift !== mainMesh) {
          // Unhover previous
          if (this.hoveredGift) {
            this.setGiftHovered(this.hoveredGift, false)
          }

          // Hover new
          this.hoveredGift = mainMesh
          this.setGiftHovered(mainMesh, true)
          this.showTooltip(intersected.userData.giftData, event.clientX, event.clientY)
        } else {
          // Same gift, just update tooltip position
          this.updateTooltipPosition(event.clientX, event.clientY)
        }

        // Only show pointer cursor if gift has a URL
        this.canvas.style.cursor = intersected.userData.giftData?.url ? 'pointer' : 'default'
      }
    } else {
      // No gift hovered
      if (this.hoveredGift) {
        this.setGiftHovered(this.hoveredGift, false)
        this.hoveredGift = null
        this.hideTooltip()
      }
      // Only reset to default if camera isn't showing pointer for dome
      const camera = this.experience.camera
      if (!camera?.isOutside) {
        this.canvas.style.cursor = 'default'
      }
    }
  }

  onClick(event) {
    if (this.hoveredGift && this.hoveredGift.userData.giftData) {
      this.openGiftLink(this.hoveredGift)
    }
  }

  openGiftLink(giftMesh) {
    const url = giftMesh.userData.giftData.url
    if (url) {
      // Use an actual anchor element click instead of window.open
      // This is less likely to be blocked by corporate security policies
      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  setGiftHovered(giftMesh, isHovered) {
    const giftSystem = this.experience.world?.giftSystem
    if (!giftSystem) return

    const gift = giftSystem.gifts.find(g => g.mesh === giftMesh)
    if (gift) {
      giftSystem.setHovered(gift, isHovered)
    }
  }

  showTooltip(giftData, x, y) {
    if (!this.tooltip) return

    // Update content
    this.tooltip.querySelector('.gift-name').textContent = giftData.name
    this.tooltip.querySelector('.gift-description').textContent = giftData.description
    this.tooltip.querySelector('.gift-price').textContent = giftData.price

    // Update hint text based on device type (hide if no URL)
    const hintEl = this.tooltip.querySelector('.gift-hint')
    if (hintEl) {
      if (giftData.url) {
        hintEl.textContent = this.isTouchDevice ? 'Tap again to view' : 'Click to view'
        hintEl.style.display = ''
      } else {
        hintEl.style.display = 'none'
      }
    }

    // Position and show
    this.updateTooltipPosition(x, y)
    this.tooltip.classList.add('visible')
  }

  updateTooltipPosition(x, y) {
    if (!this.tooltip) return

    // Offset from cursor
    const offsetX = 15
    const offsetY = 15

    // Get tooltip dimensions
    const tooltipRect = this.tooltip.getBoundingClientRect()
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // Calculate position, keeping tooltip on screen
    let posX = x + offsetX
    let posY = y + offsetY

    // Check right edge
    if (posX + tooltipRect.width > windowWidth - 10) {
      posX = x - tooltipRect.width - offsetX
    }

    // Check bottom edge
    if (posY + tooltipRect.height > windowHeight - 10) {
      posY = y - tooltipRect.height - offsetY
    }

    // Check left edge
    if (posX < 10) {
      posX = 10
    }

    // Check top edge
    if (posY < 10) {
      posY = 10
    }

    this.tooltip.style.left = `${posX}px`
    this.tooltip.style.top = `${posY}px`
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible')
    }
  }
}
