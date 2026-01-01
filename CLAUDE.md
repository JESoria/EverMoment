# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EverMoment** is a digital souvenir photo editor for tourists in El Salvador. Users upload a photo, the AI removes the background via Photoroom API, and users can position themselves over iconic El Salvador landscape templates with customizable text overlays.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Canvas**: HTML5 Canvas API (1080x1350px, 4:5 ratio for Instagram)
- **AI Integration**: Photoroom API for background removal
- **Design System**: Material Design 3

## Project Structure

```
EverMoment/
├── index.html                  # Main HTML structure
├── CLAUDE.md                   # This file
├── css/
│   └── styles.css              # All styles (Material Design 3)
├── js/
│   ├── config.js               # API keys, fonts, colors, backgrounds config
│   └── app.js                  # Main application logic
└── assets/
    └── backgrounds/            # Local background images (optional)
        ├── surf-city.jpg
        ├── volcan.jpg
        └── centro.jpg
```

## Key Architecture

### Layer System (Canvas Rendering)
The canvas uses a 3-layer compositing system rendered in `app.js`:

- **Layer 0 (Background)**: Pre-defined El Salvador landscapes (local or external URLs)
- **Layer 1 (Subject)**: User's processed photo (transparent PNG), supports drag-to-position and zoom
- **Layer 2 (Overlay)**: Branding logo, header text, footer text, watermark

### State Management
Single `state` object in `app.js` containing:
- `currentBackground`: Loaded background Image object
- `subjectImage`: Processed user photo
- `subject`: Position (x, y), scale, dimensions
- `headerText`: { text, font, size, color }
- `footerText`: { text, font, size, color }
- Drag interaction state

### Text Customization
Both header and footer text support:
- **5 font families**: Playfair Display, Montserrat, Dancing Script, Bebas Neue, Pacifico
- **4 sizes**: Small (32px), Medium (42px), Large (54px), Extra Large (68px)
- **6 colors**: White, Black, Gold, Orange, Blue, Red

## Configuration

### API Key
Set in `js/config.js`:
```javascript
const PHOTOROOM_API_KEY = 'your-api-key-here';
```

### Adding Backgrounds (Dynamic Loading)

Backgrounds load automatically from `assets/backgrounds/backgrounds.json`.

**To add new backgrounds:**

1. Place image in `assets/backgrounds/`
2. Add filename to `backgrounds.json`:
```json
[
    "surf-city.jpg",
    "volcan-santa-ana.jpg",
    "playa-el-tunco.jpg",
    "mi-nueva-imagen.jpg"
]
```

**Names are auto-generated from filename:**
- `playa-el-tunco.jpg` → "Playa El Tunco"
- `volcan_santa_ana.png` → "Volcan Santa Ana"

**Recommended image specs:**
- Resolution: 1080x1350px (ratio 4:5)
- Format: JPG or PNG
- File size: Under 2MB

## Running the Project

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# Then open http://localhost:8000
```

## Design Tokens

Color palette (CSS custom properties):
- `--azul-anil`: #003366 (primary)
- `--naranja-atardecer`: #FF8C42 (accent)
- `--blanco-arena`: #F5F5F5 (background)

## Watermark

Diagonal "EverMoment PREVIEW" watermark at 25% opacity. Applied in `renderWatermark()` and included in downloaded images.
