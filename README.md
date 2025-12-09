# Christmas List 3D

An interactive 3D snowglobe Christmas wishlist built with Three.js.

**[Live Demo](https://owen-xmas-2025.vercel.app)**

![Demo](demo.gif)

## Features

- Click the snowglobe to zoom inside
- Santa's sleigh flies overhead dropping gifts
- Hover/tap gifts to see details and links
- Cozy village with houses, trees, and snowmen
- Mobile-friendly

## Tech Stack

- [Three.js](https://threejs.org/) - 3D graphics
- Vanilla JavaScript (no framework)
- [Vite](https://vitejs.dev/) - Build tool
- [Vercel](https://vercel.com/) - Hosting

## Make Your Own

1. Fork this repo
2. Edit `src/data/gifts.json` with your own wishlist:

```json
[
  {
    "id": 1,
    "name": "Gift Name",
    "description": "Why you want it",
    "price": "$50",
    "url": "https://link-to-buy.com",
    "color": "#e74c3c"
  }
]
```

3. Deploy to Vercel:

```bash
npm install
npm run dev      # Local development
npm run build    # Production build
vercel --prod    # Deploy
```