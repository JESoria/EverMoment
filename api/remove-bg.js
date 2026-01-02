/**
 * ===========================================
 * EverMoment - API: Remove Background
 * Proxy a Photoroom API para remover fondos
 * ===========================================
 * POST /api/remove-bg
 * Body: FormData con 'image_file'
 */

const Busboy = require('busboy');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Parsear multipart form data con busboy
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        const files = [];
        const fields = {};

        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];

            file.on('data', (chunk) => chunks.push(chunk));
            file.on('end', () => {
                files.push({
                    fieldname,
                    filename,
                    mimeType,
                    buffer: Buffer.concat(chunks)
                });
            });
        });

        busboy.on('field', (fieldname, value) => {
            fields[fieldname] = value;
        });

        busboy.on('finish', () => resolve({ files, fields }));
        busboy.on('error', reject);

        req.pipe(busboy);
    });
}

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
        const { files } = await parseMultipart(req);

        // Buscar el archivo de imagen
        const imageFile = files.find(f => f.fieldname === 'image_file');
        if (!imageFile) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó imagen'
            });
        }

        // Crear FormData para Photoroom
        const formData = new FormData();
        formData.append('image_file', imageFile.buffer, {
            filename: imageFile.filename,
            contentType: imageFile.mimeType,
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

module.exports.config = {
    api: {
        bodyParser: false,
    },
};
