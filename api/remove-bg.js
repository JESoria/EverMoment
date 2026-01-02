/**
 * ===========================================
 * EverMoment - API: Remove Background
 * Proxy a Photoroom API para remover fondos
 * ===========================================
 * POST /api/remove-bg
 * Body: FormData con 'image_file'
 */

const formidable = require('formidable');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

module.exports = async (req, res) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Método no permitido'
        });
    }

    // Verificar API key configurada
    const apiKey = process.env.PHOTOROOM_API_KEY;
    if (!apiKey) {
        console.error('PHOTOROOM_API_KEY no configurada');
        return res.status(500).json({
            success: false,
            error: 'Servicio no configurado'
        });
    }

    try {
        // Parsear FormData entrante
        const form = formidable({
            maxFileSize: 10 * 1024 * 1024, // 10MB
        });

        const [fields, files] = await form.parse(req);

        // Obtener archivo
        const imageFile = files.image_file?.[0];
        if (!imageFile) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó imagen'
            });
        }

        // Crear FormData para Photoroom
        const formData = new FormData();
        formData.append('image_file', fs.createReadStream(imageFile.filepath), {
            filename: imageFile.originalFilename,
            contentType: imageFile.mimetype,
        });

        // Llamar a Photoroom API
        const response = await fetch('https://sdk.photoroom.com/v1/segment', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                ...formData.getHeaders(),
            },
            body: formData,
        });

        // Limpiar archivo temporal
        fs.unlink(imageFile.filepath, () => {});

        // Manejar errores de Photoroom
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Photoroom error:', response.status, errorText);

            let errorMessage = 'Error al procesar imagen';
            if (response.status === 401) {
                errorMessage = 'API Key inválida';
            } else if (response.status === 402) {
                errorMessage = 'Créditos agotados';
            } else if (response.status === 429) {
                errorMessage = 'Demasiadas solicitudes. Intenta de nuevo.';
            }

            return res.status(response.status).json({
                success: false,
                error: errorMessage
            });
        }

        // Obtener imagen procesada
        const buffer = await response.buffer();

        // Retornar imagen PNG
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

    } catch (error) {
        console.error('Remove-bg error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Configuración para Vercel - deshabilitar body parser
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
