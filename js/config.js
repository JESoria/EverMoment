/**
 * ===========================================
 * EverMoment - Configuration
 * Configuración global de la aplicación
 * ===========================================
 */

// ============================================
// API KEY - PEGA TU API KEY DE PHOTOROOM AQUÍ
// ============================================
const PHOTOROOM_API_KEY = 'sk_pr_evermoment_4ce823c496a6dac232d52777c93c1f35a07e105f';

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

    // Ruta de la carpeta de fondos
    backgroundsPath: 'assets/backgrounds/',
    backgroundsExtensions: ['.jpg', '.png', '.webp'],  // Extensiones a buscar (en orden de prioridad)
    backgroundsMaxScan: 50,                            // Máximo de imágenes a buscar

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

    // API de Photoroom
    api: {
        endpoint: 'https://sdk.photoroom.com/v1/segment',
        maxFileSize: 10 * 1024 * 1024 // 10MB
    }
};

// ============================================
// UTILIDAD: Convertir nombre de archivo a título
// "playa-el-tunco.jpg" → "Playa El Tunco"
// ============================================
function filenameToTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, '')           // Quitar extensión
        .replace(/[-_]/g, ' ')              // Guiones/underscores a espacios
        .replace(/\b\w/g, c => c.toUpperCase()); // Capitalizar palabras
}

// Congelar configuración
Object.freeze(CONFIG);
Object.freeze(CONFIG.canvas);
Object.freeze(CONFIG.subject);
Object.freeze(CONFIG.watermark);
Object.freeze(CONFIG.branding);
Object.freeze(CONFIG.api);
