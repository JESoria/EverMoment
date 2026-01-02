/**
 * ===========================================
 * EverMoment - Configuration
 * Configuración global de la aplicación
 * ===========================================
 */

// ============================================
// CONFIGURACIÓN GENERAL
// ============================================
const CONFIG = {
    // Dimensiones del Canvas (ratio 4:5 - ideal para Instagram)
    canvas: {
        width: 1080,
        height: 1350
    },

    // Configuración del sujeto (foto del usuario)
    subject: {
        defaultScale: 0.85,
        minScale: 0.3,
        maxScale: 2.5
    },

    // Configuración de la marca de agua
    watermark: {
        text: 'EverMoment PREVIEW',
        font: 'bold 48px Montserrat, sans-serif',
        color: 'rgba(255, 255, 255, 0.25)'
    },

    // Configuración del branding (logo fijo)
    branding: {
        logo: '🌅 EverMoment',
        font: 'bold 36px Playfair Display, serif',
        subFont: '20px Montserrat, sans-serif'
    },

    // Fuentes disponibles para textos personalizados
    fonts: [
        { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif' },
        { id: 'montserrat', name: 'Montserrat', family: 'Montserrat, sans-serif' },
        { id: 'dancing', name: 'Dancing Script', family: 'Dancing Script, cursive' },
        { id: 'bebas', name: 'Bebas Neue', family: 'Bebas Neue, sans-serif' },
        { id: 'pacifico', name: 'Pacifico', family: 'Pacifico, cursive' }
    ],

    // Tamaños de fuente disponibles
    fontSizes: [
        { id: 'small', name: 'Pequeño', size: 32 },
        { id: 'medium', name: 'Mediano', size: 42 },
        { id: 'large', name: 'Grande', size: 54 },
        { id: 'xlarge', name: 'Extra Grande', size: 68 }
    ],

    // Colores predefinidos para texto
    textColors: [
        { id: 'white', name: 'Blanco', color: '#FFFFFF' },
        { id: 'black', name: 'Negro', color: '#000000' },
        { id: 'gold', name: 'Dorado', color: '#FFD700' },
        { id: 'orange', name: 'Naranja', color: '#FF8C42' },
        { id: 'blue', name: 'Azul', color: '#003366' },
        { id: 'red', name: 'Rojo', color: '#DC3545' }
    ],

    // API endpoints (backend en Vercel)
    api: {
        removeBg: '/api/remove-bg',
        backgrounds: '/api/backgrounds/list',
        maxFileSize: 10 * 1024 * 1024 // 10MB
    }
};

// Congelar configuración
Object.freeze(CONFIG);
Object.freeze(CONFIG.canvas);
Object.freeze(CONFIG.subject);
Object.freeze(CONFIG.watermark);
Object.freeze(CONFIG.branding);
Object.freeze(CONFIG.api);
