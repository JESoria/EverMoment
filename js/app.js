/**
 * ===========================================
 * EverMoment - Main Application
 * Editor de recuerdos digitales para El Salvador
 * ===========================================
 */

(function() {
    'use strict';

    /* ===========================================
       ESTADO DE LA APLICACIÓN
       =========================================== */
    const state = {
        backgrounds: [],            // Lista de fondos cargados dinámicamente
        currentBackground: null,    // Imagen de fondo actual (plantilla)
        customBackground: null,     // Imagen de fondo personalizado
        backgroundType: 'templates', // 'templates' o 'custom'
        subjectImage: null,         // Imagen procesada del usuario
        subject: {
            x: CONFIG.canvas.width / 2,
            y: CONFIG.canvas.height / 2,
            scale: CONFIG.subject.defaultScale,
            width: 0,
            height: 0
        },
        // Image adjustments
        adjustments: {
            brightness: 1,
            contrast: 1,
            saturation: 1
        },
        // Header text configuration
        headerText: {
            text: '',
            font: CONFIG.fonts[0].family,
            size: 42,
            color: CONFIG.textColors[0].color
        },
        // Footer text configuration
        footerText: {
            text: '',
            font: CONFIG.fonts[0].family,
            size: 42,
            color: CONFIG.textColors[0].color
        },
        isDragging: false,
        isLocked: false,            // Lock position for mobile scroll
        dragStart: { x: 0, y: 0 },
        lastPosition: { x: 0, y: 0 }
    };

    /* ===========================================
       ELEMENTOS DEL DOM
       =========================================== */
    const elements = {
        uploadSection: document.getElementById('upload-section'),
        editorSection: document.getElementById('editor-section'),
        uploadArea: document.getElementById('upload-area'),
        uploadBtn: document.getElementById('upload-btn'),
        fileInput: document.getElementById('file-input'),
        processingOverlay: document.getElementById('processing-overlay'),
        backgroundsGrid: document.getElementById('backgrounds-grid'),
        canvasContainer: document.getElementById('canvas-container'),
        canvas: document.getElementById('main-canvas'),
        canvasHint: document.getElementById('canvas-hint'),
        canvasLockBtn: document.getElementById('canvas-lock-btn'),
        lockIcon: document.getElementById('lock-icon'),
        // Background type toggle
        toggleTemplates: document.getElementById('toggle-templates'),
        toggleCustom: document.getElementById('toggle-custom'),
        templatesSection: document.getElementById('templates-section'),
        customBgSection: document.getElementById('custom-bg-section'),
        customBgArea: document.getElementById('custom-bg-area'),
        customBgPreview: document.getElementById('custom-bg-preview'),
        uploadBgBtn: document.getElementById('upload-bg-btn'),
        uploadBgInput: document.getElementById('upload-bg'),
        // Carousel buttons
        carouselPrev: document.getElementById('carousel-prev'),
        carouselNext: document.getElementById('carousel-next'),
        // Zoom and adjustments
        zoomSlider: document.getElementById('zoom-slider'),
        zoomValue: document.getElementById('zoom-value'),
        brightnessSlider: document.getElementById('brightness-slider'),
        brightnessValue: document.getElementById('brightness-value'),
        contrastSlider: document.getElementById('contrast-slider'),
        contrastValue: document.getElementById('contrast-value'),
        saturationSlider: document.getElementById('saturation-slider'),
        saturationValue: document.getElementById('saturation-value'),
        // Header controls
        headerTextInput: document.getElementById('header-text'),
        headerFont: document.getElementById('header-font'),
        headerSize: document.getElementById('header-size'),
        headerColors: document.getElementById('header-colors'),
        // Footer controls
        footerTextInput: document.getElementById('footer-text'),
        footerFont: document.getElementById('footer-font'),
        footerSize: document.getElementById('footer-size'),
        footerColors: document.getElementById('footer-colors'),
        // Buttons
        resetBtn: document.getElementById('reset-btn'),
        downloadBtn: document.getElementById('download-btn'),
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastMessage: document.getElementById('toast-message')
    };

    // Contexto del canvas
    const ctx = elements.canvas.getContext('2d');
    elements.canvas.width = CONFIG.canvas.width;
    elements.canvas.height = CONFIG.canvas.height;

    /* ===========================================
       INICIALIZACIÓN DE CONTROLES
       =========================================== */

    /**
     * Poblar selectores de fuente
     */
    function initFontSelectors() {
        const fontOptions = CONFIG.fonts.map(font =>
            `<option value="${font.family}">${font.name}</option>`
        ).join('');

        elements.headerFont.innerHTML = fontOptions;
        elements.footerFont.innerHTML = fontOptions;
    }

    /**
     * Inicializar controles de ajuste de imagen
     */
    function initAdjustmentControls() {
        // Brightness
        elements.brightnessSlider.addEventListener('input', (e) => {
            state.adjustments.brightness = parseFloat(e.target.value);
            elements.brightnessValue.textContent = Math.round(state.adjustments.brightness * 100) + '%';
            render();
        });

        // Contrast
        elements.contrastSlider.addEventListener('input', (e) => {
            state.adjustments.contrast = parseFloat(e.target.value);
            elements.contrastValue.textContent = Math.round(state.adjustments.contrast * 100) + '%';
            render();
        });

        // Saturation
        elements.saturationSlider.addEventListener('input', (e) => {
            state.adjustments.saturation = parseFloat(e.target.value);
            elements.saturationValue.textContent = Math.round(state.adjustments.saturation * 100) + '%';
            render();
        });
    }

    /**
     * Inicializar carrusel de fondos
     */
    function initCarousel() {
        const scrollAmount = 120; // Width of one item + gap

        elements.carouselPrev.addEventListener('click', () => {
            elements.backgroundsGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        elements.carouselNext.addEventListener('click', () => {
            elements.backgroundsGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    /**
     * Inicializar botón de bloqueo
     */
    function initLockButton() {
        elements.canvasLockBtn.addEventListener('click', () => {
            state.isLocked = !state.isLocked;

            if (state.isLocked) {
                elements.canvasLockBtn.classList.add('locked');
                elements.canvasContainer.classList.add('locked');
                elements.lockIcon.textContent = 'lock';
            } else {
                elements.canvasLockBtn.classList.remove('locked');
                elements.canvasContainer.classList.remove('locked');
                elements.lockIcon.textContent = 'lock_open';
            }
        });
    }

    /**
     * Inicializar toggle de tipo de fondo
     */
    function initBackgroundToggle() {
        // Toggle Templates
        elements.toggleTemplates.addEventListener('click', () => {
            if (state.backgroundType === 'templates') return;

            state.backgroundType = 'templates';
            elements.toggleTemplates.classList.add('active');
            elements.toggleCustom.classList.remove('active');
            elements.templatesSection.classList.remove('hidden');
            elements.customBgSection.classList.add('hidden');
            render();
        });

        // Toggle Custom
        elements.toggleCustom.addEventListener('click', () => {
            if (state.backgroundType === 'custom') return;

            state.backgroundType = 'custom';
            elements.toggleCustom.classList.add('active');
            elements.toggleTemplates.classList.remove('active');
            elements.customBgSection.classList.remove('hidden');
            elements.templatesSection.classList.add('hidden');
            render();
        });

        // Custom background upload button
        elements.uploadBgBtn.addEventListener('click', () => {
            elements.uploadBgInput.click();
        });

        // Custom background file input
        elements.uploadBgInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Por favor, selecciona una imagen', 'error');
                return;
            }

            try {
                const img = await loadImage(file);
                state.customBackground = img;

                // Update preview
                elements.customBgPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Fondo personalizado">`;
                elements.customBgArea.classList.add('has-image');

                showToast('¡Paisaje cargado!', 'success');
                render();
            } catch (error) {
                console.error('Error loading custom background:', error);
                showToast('Error al cargar el paisaje', 'error');
            }
        });

        // Drag & drop for custom background
        elements.customBgArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.customBgArea.style.borderColor = 'var(--naranja-atardecer)';
        });

        elements.customBgArea.addEventListener('dragleave', () => {
            if (!state.customBackground) {
                elements.customBgArea.style.borderColor = '';
            }
        });

        elements.customBgArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            elements.customBgArea.style.borderColor = '';

            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Por favor, arrastra una imagen', 'error');
                return;
            }

            try {
                const img = await loadImage(file);
                state.customBackground = img;

                // Update preview
                elements.customBgPreview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="Fondo personalizado">`;
                elements.customBgArea.classList.add('has-image');

                showToast('¡Paisaje cargado!', 'success');
                render();
            } catch (error) {
                console.error('Error loading custom background:', error);
                showToast('Error al cargar el paisaje', 'error');
            }
        });
    }

    /**
     * Crear botones de color
     */
    function initColorPickers() {
        const createColorButtons = (container, prefix) => {
            container.innerHTML = CONFIG.textColors.map((colorObj, index) =>
                `<button type="button"
                    class="color-option ${index === 0 ? 'selected' : ''}"
                    data-color="${colorObj.color}"
                    data-target="${prefix}"
                    style="background-color: ${colorObj.color}"
                    title="${colorObj.name}">
                </button>`
            ).join('');
        };

        createColorButtons(elements.headerColors, 'header');
        createColorButtons(elements.footerColors, 'footer');

        // Event listeners para color picker
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.addEventListener('click', handleColorSelect);
        });
    }

    /**
     * Manejar selección de color
     */
    function handleColorSelect(e) {
        const btn = e.currentTarget;
        const color = btn.dataset.color;
        const target = btn.dataset.target;

        // Actualizar UI
        const container = target === 'header' ? elements.headerColors : elements.footerColors;
        container.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Actualizar estado
        if (target === 'header') {
            state.headerText.color = color;
        } else {
            state.footerText.color = color;
        }

        render();
    }

    /* ===========================================
       API: Procesar imagen con Photoroom
       =========================================== */
    async function processPhoto(file) {
        if (!PHOTOROOM_API_KEY || PHOTOROOM_API_KEY === 'TU_KEY_AQUI') {
            throw new Error('API Key no configurada. Abre js/config.js y pega tu API Key de Photoroom.');
        }

        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Por favor, selecciona un archivo de imagen válido.');
        }

        if (file.size > CONFIG.api.maxFileSize) {
            throw new Error('La imagen es muy grande. Máximo 10MB.');
        }

        const formData = new FormData();
        formData.append('image_file', file);

        try {
            const response = await fetch(CONFIG.api.endpoint, {
                method: 'POST',
                headers: {
                    'x-api-key': PHOTOROOM_API_KEY
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 401) {
                    throw new Error('API Key inválida. Verifica tu clave de Photoroom.');
                } else if (response.status === 402) {
                    throw new Error('Créditos agotados en tu cuenta de Photoroom.');
                } else if (response.status === 429) {
                    throw new Error('Demasiadas solicitudes. Espera un momento.');
                }

                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const processedBlob = await response.blob();
            return processedBlob;

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Sin conexión a internet. Verifica tu conexión.');
            }
            throw error;
        }
    }

    /* ===========================================
       UI: Toast Notification
       =========================================== */
    function showToast(message, type = 'info') {
        elements.toast.className = 'toast';

        const icons = {
            info: 'info',
            success: 'check_circle',
            error: 'error'
        };

        elements.toastIcon.textContent = icons[type] || icons.info;
        elements.toastMessage.textContent = message;

        if (type !== 'info') {
            elements.toast.classList.add(type);
        }

        elements.toast.classList.add('show');

        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3500);
    }

    /**
     * Mostrar/ocultar overlay de procesamiento
     */
    function setProcessing(active) {
        if (active) {
            elements.processingOverlay.classList.add('active');
        } else {
            elements.processingOverlay.classList.remove('active');
        }
    }

    /* ===========================================
       UTILIDAD: Cargar imagen
       =========================================== */
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Error al cargar imagen'));

            if (src instanceof Blob) {
                img.src = URL.createObjectURL(src);
            } else {
                img.src = src;
            }
        });
    }

    /* ===========================================
       FONDOS: Cargar dinámicamente (imágenes numeradas)
       =========================================== */

    /**
     * Verificar si una imagen existe
     */
    function imageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    /**
     * Buscar imagen con cualquier extensión soportada
     * Retorna la URL si existe, null si no
     */
    async function findImageWithExtensions(number) {
        for (const ext of CONFIG.backgroundsExtensions) {
            const filename = `${number}${ext}`;
            const url = CONFIG.backgroundsPath + filename;

            if (await imageExists(url)) {
                return { filename, url };
            }
        }
        return null;
    }

    /**
     * Cargar lista de fondos automáticamente
     * Busca imágenes numeradas: 1.jpg, 1.png, 2.jpg, 2.png...
     * Las nombra como "Fondo 1", "Fondo 2", etc.
     */
    async function loadBackgroundsList() {
        try {
            const backgrounds = [];

            // Escanear imágenes numeradas secuencialmente
            for (let i = 1; i <= CONFIG.backgroundsMaxScan; i++) {
                const found = await findImageWithExtensions(i);

                if (!found) {
                    // Si no existe con ninguna extensión, dejamos de buscar
                    break;
                }

                backgrounds.push({
                    id: `fondo-${i}`,
                    name: `Fondo ${i}`,
                    filename: found.filename,
                    url: found.url,
                    thumbnail: found.url
                });
            }

            state.backgrounds = backgrounds;
            return state.backgrounds;

        } catch (error) {
            console.error('Error loading backgrounds:', error);
            showToast('Error al cargar fondos', 'error');
            return [];
        }
    }

    /**
     * Inicializar selector de fondos
     */
    async function initBackgrounds() {
        elements.backgroundsGrid.innerHTML = '<p style="text-align:center;color:#666;grid-column:1/-1;">Cargando fondos...</p>';

        // Cargar lista de fondos desde JSON
        const backgrounds = await loadBackgroundsList();

        if (backgrounds.length === 0) {
            elements.backgroundsGrid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">No hay fondos disponibles</p>';
            return;
        }

        elements.backgroundsGrid.innerHTML = '';

        backgrounds.forEach((bg, index) => {
            const option = document.createElement('div');
            option.className = 'bg-option' + (index === 0 ? ' selected' : '');
            option.dataset.id = bg.id;
            option.innerHTML = `
                <img src="${bg.thumbnail}" alt="${bg.name}" loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 125%22%3E%3Crect fill=%22%23003366%22 width=%22100%22 height=%22125%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%228%22%3E${encodeURIComponent(bg.name)}%3C/text%3E%3C/svg%3E'">
                <span class="bg-name">${bg.name}</span>
            `;

            option.addEventListener('click', () => selectBackground(bg.id));
            elements.backgroundsGrid.appendChild(option);
        });

        // Cargar primer fondo por defecto
        if (backgrounds.length > 0) {
            selectBackground(backgrounds[0].id);
        }
    }

    /**
     * Seleccionar fondo (soporta URLs locales y externas)
     */
    async function selectBackground(id) {
        const bg = state.backgrounds.find(b => b.id === id);
        if (!bg) return;

        // Actualizar UI
        document.querySelectorAll('.bg-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });

        try {
            state.currentBackground = await loadImage(bg.url);
            render();
        } catch (error) {
            console.error('Error loading background:', error);
            showToast('Error al cargar el fondo. Verifica que la imagen existe.', 'error');
        }
    }

    /**
     * Establecer imagen del sujeto
     */
    async function setSubjectImage(blob) {
        try {
            const img = await loadImage(blob);
            state.subjectImage = img;
            state.subject.width = img.width;
            state.subject.height = img.height;

            const maxDim = Math.max(CONFIG.canvas.width, CONFIG.canvas.height) * 0.65;
            const imgMaxDim = Math.max(img.width, img.height);
            state.subject.scale = Math.min(maxDim / imgMaxDim, CONFIG.subject.defaultScale);

            state.subject.x = CONFIG.canvas.width / 2;
            state.subject.y = CONFIG.canvas.height / 2;

            elements.zoomSlider.value = state.subject.scale;
            elements.zoomValue.textContent = Math.round(state.subject.scale * 100) + '%';

            render();
        } catch (error) {
            console.error('Error setting subject:', error);
            throw error;
        }
    }

    /* ===========================================
       RENDERIZADO - Sistema de Capas
       L0: Fondo (Background)
       L1: Sujeto (Usuario procesado)
       L2: Overlay (Branding, Header, Footer, Watermark)
       =========================================== */

    function render() {
        ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

        // === LAYER 0: Fondo ===
        renderBackground();

        // === LAYER 1: Sujeto ===
        renderSubject();

        // === LAYER 2: Overlay ===
        renderOverlay();
    }

    /**
     * L0 - Renderizar fondo (plantilla o personalizado)
     */
    function renderBackground() {
        // Determinar qué fondo usar según el tipo seleccionado
        let img = null;

        if (state.backgroundType === 'custom' && state.customBackground) {
            img = state.customBackground;
        } else if (state.backgroundType === 'templates' && state.currentBackground) {
            img = state.currentBackground;
        }

        // Si no hay imagen, dibujar gradiente por defecto
        if (!img) {
            const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.canvas.height);
            gradient.addColorStop(0, '#003366');
            gradient.addColorStop(1, '#001a33');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
            return;
        }

        // Calcular dimensiones para cover (llenar canvas manteniendo proporción)
        const imgRatio = img.width / img.height;
        const canvasRatio = CONFIG.canvas.width / CONFIG.canvas.height;

        let dw, dh, dx, dy;

        if (imgRatio > canvasRatio) {
            dh = CONFIG.canvas.height;
            dw = dh * imgRatio;
            dx = (CONFIG.canvas.width - dw) / 2;
            dy = 0;
        } else {
            dw = CONFIG.canvas.width;
            dh = dw / imgRatio;
            dx = 0;
            dy = (CONFIG.canvas.height - dh) / 2;
        }

        ctx.drawImage(img, dx, dy, dw, dh);
    }

    /**
     * L1 - Renderizar sujeto con filtros
     */
    function renderSubject() {
        if (!state.subjectImage) return;

        const img = state.subjectImage;
        const scaledW = state.subject.width * state.subject.scale;
        const scaledH = state.subject.height * state.subject.scale;

        const drawX = state.subject.x - scaledW / 2;
        const drawY = state.subject.y - scaledH / 2;

        ctx.save();

        // Apply image adjustments filter
        const { brightness, contrast, saturation } = state.adjustments;
        ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 15;

        ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
        ctx.restore();
    }

    /**
     * L2 - Renderizar overlay
     */
    function renderOverlay() {
        const padding = 45;

        // === LOGO / BRANDING (esquina superior izquierda) ===
        ctx.save();
        ctx.font = CONFIG.branding.font;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(CONFIG.branding.logo, padding, padding);

        ctx.font = CONFIG.branding.subFont;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillText('Digital Souvenir', padding, padding + 45);
        ctx.restore();

        // === HEADER TEXT (título superior personalizable) ===
        if (state.headerText.text) {
            ctx.save();
            ctx.font = `bold ${state.headerText.size}px ${state.headerText.font}`;
            ctx.fillStyle = state.headerText.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Posición debajo del logo
            ctx.fillText(state.headerText.text, CONFIG.canvas.width / 2, 160);
            ctx.restore();
        }

        // === FOOTER TEXT (título inferior personalizable) ===
        if (state.footerText.text) {
            ctx.save();
            ctx.font = `bold ${state.footerText.size}px ${state.footerText.font}`;
            ctx.fillStyle = state.footerText.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText(state.footerText.text, CONFIG.canvas.width / 2, CONFIG.canvas.height - 100);
            ctx.restore();
        }

        // === MARCA DE AGUA DIAGONAL ===
        renderWatermark();

        // === CRÉDITOS (esquina inferior derecha) ===
        ctx.save();
        ctx.font = '22px Montserrat, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText('evermoment.sv', CONFIG.canvas.width - padding, CONFIG.canvas.height - padding);
        ctx.restore();
    }

    /**
     * Renderizar marca de agua diagonal
     */
    function renderWatermark() {
        ctx.save();
        ctx.translate(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
        ctx.rotate(-Math.PI / 4);

        ctx.font = CONFIG.watermark.font;
        ctx.fillStyle = CONFIG.watermark.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lineHeight = 200;
        const numLines = 8;

        for (let i = -numLines; i <= numLines; i++) {
            ctx.fillText(CONFIG.watermark.text, 0, i * lineHeight);
        }

        ctx.restore();
    }

    /* ===========================================
       INTERACTIVIDAD - Arrastrar sujeto
       =========================================== */

    function getCanvasCoords(clientX, clientY) {
        const rect = elements.canvas.getBoundingClientRect();
        const scaleX = CONFIG.canvas.width / rect.width;
        const scaleY = CONFIG.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function isInsideSubject(x, y) {
        if (!state.subjectImage) return false;

        const hw = (state.subject.width * state.subject.scale) / 2;
        const hh = (state.subject.height * state.subject.scale) / 2;

        return (
            x >= state.subject.x - hw &&
            x <= state.subject.x + hw &&
            y >= state.subject.y - hh &&
            y <= state.subject.y + hh
        );
    }

    function startDrag(x, y) {
        // Don't allow dragging when locked
        if (state.isLocked) return;
        if (!isInsideSubject(x, y)) return;

        state.isDragging = true;
        state.dragStart = { x, y };
        state.lastPosition = {
            x: state.subject.x,
            y: state.subject.y
        };

        elements.canvas.style.cursor = 'grabbing';
        elements.canvasHint.classList.add('hidden');
    }

    function drag(x, y) {
        if (!state.isDragging) return;

        const dx = x - state.dragStart.x;
        const dy = y - state.dragStart.y;

        state.subject.x = state.lastPosition.x + dx;
        state.subject.y = state.lastPosition.y + dy;

        const margin = 150;
        const hw = (state.subject.width * state.subject.scale) / 2;
        const hh = (state.subject.height * state.subject.scale) / 2;

        state.subject.x = Math.max(-hw + margin, Math.min(CONFIG.canvas.width + hw - margin, state.subject.x));
        state.subject.y = Math.max(-hh + margin, Math.min(CONFIG.canvas.height + hh - margin, state.subject.y));

        render();
    }

    function endDrag() {
        state.isDragging = false;
        elements.canvas.style.cursor = 'grab';
    }

    // Mouse events
    elements.canvas.addEventListener('mousedown', (e) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        startDrag(coords.x, coords.y);
    });

    elements.canvas.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        drag(coords.x, coords.y);
    });

    elements.canvas.addEventListener('mouseup', endDrag);
    elements.canvas.addEventListener('mouseleave', endDrag);

    // Touch events
    elements.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const coords = getCanvasCoords(touch.clientX, touch.clientY);
            startDrag(coords.x, coords.y);
        }
    }, { passive: false });

    elements.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (state.isDragging && e.touches.length === 1) {
            const touch = e.touches[0];
            const coords = getCanvasCoords(touch.clientX, touch.clientY);
            drag(coords.x, coords.y);
        }
    }, { passive: false });

    elements.canvas.addEventListener('touchend', endDrag);
    elements.canvas.addEventListener('touchcancel', endDrag);

    /* ===========================================
       CONTROLES DE LA UI
       =========================================== */

    // Zoom slider
    elements.zoomSlider.addEventListener('input', (e) => {
        state.subject.scale = parseFloat(e.target.value);
        elements.zoomValue.textContent = Math.round(state.subject.scale * 100) + '%';
        render();
    });

    // Header text input
    elements.headerTextInput.addEventListener('input', (e) => {
        state.headerText.text = e.target.value.substring(0, 40);
        render();
    });

    // Header font select
    elements.headerFont.addEventListener('change', (e) => {
        state.headerText.font = e.target.value;
        render();
    });

    // Header size input
    elements.headerSize.addEventListener('input', (e) => {
        const size = Math.min(120, Math.max(16, parseInt(e.target.value) || 42));
        state.headerText.size = size;
        render();
    });

    // Footer text input
    elements.footerTextInput.addEventListener('input', (e) => {
        state.footerText.text = e.target.value.substring(0, 40);
        render();
    });

    // Footer font select
    elements.footerFont.addEventListener('change', (e) => {
        state.footerText.font = e.target.value;
        render();
    });

    // Footer size input
    elements.footerSize.addEventListener('input', (e) => {
        const size = Math.min(120, Math.max(16, parseInt(e.target.value) || 42));
        state.footerText.size = size;
        render();
    });

    // Reset button
    elements.resetBtn.addEventListener('click', () => {
        // Reset subject position
        state.subject.x = CONFIG.canvas.width / 2;
        state.subject.y = CONFIG.canvas.height / 2;
        state.subject.scale = CONFIG.subject.defaultScale;

        // Reset adjustments
        state.adjustments.brightness = 1;
        state.adjustments.contrast = 1;
        state.adjustments.saturation = 1;

        // Reset texts
        state.headerText.text = '';
        state.headerText.font = CONFIG.fonts[0].family;
        state.headerText.size = 42;
        state.headerText.color = CONFIG.textColors[0].color;

        state.footerText.text = '';
        state.footerText.font = CONFIG.fonts[0].family;
        state.footerText.size = 42;
        state.footerText.color = CONFIG.textColors[0].color;

        // Reset background type to templates
        state.backgroundType = 'templates';
        state.customBackground = null;
        elements.toggleTemplates.classList.add('active');
        elements.toggleCustom.classList.remove('active');
        elements.templatesSection.classList.remove('hidden');
        elements.customBgSection.classList.add('hidden');
        elements.customBgPreview.innerHTML = `
            <span class="material-icons-round">landscape</span>
            <p>Sube tu paisaje</p>
        `;
        elements.customBgArea.classList.remove('has-image');

        // Reset lock
        state.isLocked = false;
        elements.canvasLockBtn.classList.remove('locked');
        elements.canvasContainer.classList.remove('locked');
        elements.lockIcon.textContent = 'lock_open';

        // Reset UI - Zoom
        elements.zoomSlider.value = CONFIG.subject.defaultScale;
        elements.zoomValue.textContent = Math.round(CONFIG.subject.defaultScale * 100) + '%';

        // Reset UI - Adjustments
        elements.brightnessSlider.value = 1;
        elements.brightnessValue.textContent = '100%';
        elements.contrastSlider.value = 1;
        elements.contrastValue.textContent = '100%';
        elements.saturationSlider.value = 1;
        elements.saturationValue.textContent = '100%';

        // Reset UI - Text inputs
        elements.headerTextInput.value = '';
        elements.footerTextInput.value = '';
        elements.headerFont.value = CONFIG.fonts[0].family;
        elements.footerFont.value = CONFIG.fonts[0].family;
        elements.headerSize.value = 42;
        elements.footerSize.value = 42;

        // Reset color selections
        elements.headerColors.querySelectorAll('.color-option').forEach((btn, i) => {
            btn.classList.toggle('selected', i === 0);
        });
        elements.footerColors.querySelectorAll('.color-option').forEach((btn, i) => {
            btn.classList.toggle('selected', i === 0);
        });

        elements.canvasHint.classList.remove('hidden');

        render();
        showToast('Todo reiniciado', 'info');
    });

    // Download button
    elements.downloadBtn.addEventListener('click', () => {
        try {
            const dataURL = elements.canvas.toDataURL('image/png');

            const link = document.createElement('a');
            link.download = `evermoment-recuerdo-${Date.now()}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('¡Recuerdo guardado!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Error al guardar', 'error');
        }
    });

    /* ===========================================
       MANEJO DE ARCHIVOS (Upload)
       =========================================== */

    async function handleFileSelect(file) {
        if (!file) return;

        setProcessing(true);

        try {
            const processedBlob = await processPhoto(file);
            await setSubjectImage(processedBlob);

            elements.uploadSection.classList.add('hidden');
            elements.editorSection.classList.add('active');

            showToast('¡Foto procesada exitosamente!', 'success');

        } catch (error) {
            console.error('Processing error:', error);
            showToast(error.message, 'error');
        } finally {
            setProcessing(false);
        }
    }

    elements.uploadArea.addEventListener('click', () => {
        elements.fileInput.click();
    });

    elements.uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Drag & Drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFileSelect(file);
        } else {
            showToast('Por favor, selecciona una imagen', 'error');
        }
    });

    /* ===========================================
       INICIALIZACIÓN
       =========================================== */
    function init() {
        initFontSelectors();
        initAdjustmentControls();
        initColorPickers();
        initCarousel();
        initLockButton();
        initBackgroundToggle();
        initBackgrounds();
        render();
        console.log('🌅 EverMoment initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
