import './style.css'
import Experience from './Experience/Experience.js'
import giftsData from './data/gifts.json'

window.experience = new Experience({
  targetElement: document.querySelector('.experience')
})

// List modal functionality
const viewListBtn = document.getElementById('view-list-btn')
const listModal = document.getElementById('list-modal')
const closeModalBtn = document.getElementById('close-modal-btn')
const listItems = document.getElementById('list-items')

function renderListItems() {
  listItems.innerHTML = giftsData.gifts.map(gift => {
    const hasLink = !!gift.url
    const itemClass = hasLink ? 'list-item clickable' : 'list-item'

    const content = `
      <div class="list-item-name">${gift.name}</div>
      ${gift.description ? `<div class="list-item-description">${gift.description}</div>` : ''}
      ${gift.price ? `<div class="list-item-price">${gift.price}</div>` : ''}
    `

    if (hasLink) {
      return `<a href="${gift.url}" target="_blank" rel="noopener noreferrer" class="${itemClass}" style="border-left-color: ${gift.color}">${content}</a>`
    }

    return `<div class="${itemClass}" style="border-left-color: ${gift.color}">${content}</div>`
  }).join('')
}

function showModal() {
  renderListItems()
  listModal.classList.add('visible')
}

viewListBtn.addEventListener('click', showModal)

// Show the "view list" button after entering the globe
window.addEventListener('enteredGlobe', () => {
  viewListBtn.classList.remove('hidden')
})

closeModalBtn.addEventListener('click', () => {
  listModal.classList.remove('visible')
})

listModal.addEventListener('click', (e) => {
  if (e.target === listModal) {
    listModal.classList.remove('visible')
  }
})
