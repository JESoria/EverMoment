/**
 * ===========================================
 * EverMoment - API: Crear Background
 * Endpoint admin para crear nuevo fondo
 * ===========================================
 * POST /api/backgrounds/create
 * Headers: Authorization: Bearer <token>
 * Body: FormData con 'name' y 'image'
 */

const Busboy = require('busboy');
const path = require('path');
const { verifyAdmin, sendAuthError, supabaseAdmin } = require('../middleware/auth');

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

const handler = async (req, res) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Método no permitido'
        });
    }

    // Verificar admin
    const { error: authError } = await verifyAdmin(req);
    if (authError) {
        return sendAuthError(res, authError);
    }

    try {
        // Parsear FormData
        const { files, fields } = await parseMultipart(req);

        // Validar campos
        const name = fields.name;
        const imageFile = files.find(f => f.fieldname === 'image');

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El nombre es requerido'
            });
        }

        if (!imageFile) {
            return res.status(400).json({
                success: false,
                error: 'La imagen es requerida'
            });
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(imageFile.mimeType)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de imagen no válido. Use JPG, PNG o WebP.'
            });
        }

        // Generar nombre único para el archivo
        const ext = path.extname(imageFile.filename) || '.jpg';
        const fileName = `bg_${Date.now()}${ext}`;
        const filePath = `backgrounds/${fileName}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await supabaseAdmin
            .storage
            .from('backgrounds')
            .upload(filePath, imageFile.buffer, {
                contentType: imageFile.mimeType,
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return res.status(500).json({
                success: false,
                error: 'Error al subir imagen'
            });
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin
            .storage
            .from('backgrounds')
            .getPublicUrl(filePath);

        const fileUrl = urlData.publicUrl;

        // Obtener el mayor display_order actual
        const { data: maxOrderData } = await supabaseAdmin
            .from('backgrounds')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1);

        const nextOrder = (maxOrderData?.[0]?.display_order || 0) + 1;

        // Insertar en base de datos
        const { data: background, error: dbError } = await supabaseAdmin
            .from('backgrounds')
            .insert({
                name: name.trim(),
                file_path: filePath,
                file_url: fileUrl,
                active: fields.active !== 'false',
                display_order: nextOrder
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Intentar eliminar archivo subido
            await supabaseAdmin.storage.from('backgrounds').remove([filePath]);
            return res.status(500).json({
                success: false,
                error: 'Error al guardar en base de datos'
            });
        }

        res.status(201).json({
            success: true,
            data: background
        });

    } catch (error) {
        console.error('Create background error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
