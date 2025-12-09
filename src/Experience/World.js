import Experience from './Experience.js'
import Environment from './Environment.js'
import Sleigh from './Sleigh.js'
import GiftSystem from './GiftSystem.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.setEnvironment()
    this.setSleigh()
    this.setGiftSystem()
  }

  setEnvironment() {
    this.environment = new Environment()
  }

  setSleigh() {
    this.sleigh = new Sleigh()
  }

  setGiftSystem() {
    this.giftSystem = new GiftSystem()
  }

  update() {
    this.sleigh?.update()
    this.giftSystem?.update()
    this.environment?.update()
  }
}
