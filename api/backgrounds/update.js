/**
 * ===========================================
 * EverMoment - API: Actualizar Background
 * Endpoint admin para actualizar fondo existente
 * ===========================================
 * PUT /api/backgrounds/update?id=<id>
 * Headers: Authorization: Bearer <token>
 * Body: JSON { name, active, display_order } o FormData con 'image'
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

// Parsear JSON del body
function parseJSON(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
                resolve(body);
            } catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

const handler = async (req, res) => {
    // Solo permitir PUT
    if (req.method !== 'PUT') {
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

    // Obtener ID del query
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({
            success: false,
            error: 'ID es requerido'
        });
    }

    try {
        // Verificar que el fondo existe
        const { data: existing, error: findError } = await supabaseAdmin
            .from('backgrounds')
            .select('*')
            .eq('id', id)
            .single();

        if (findError || !existing) {
            return res.status(404).json({
                success: false,
                error: 'Fondo no encontrado'
            });
        }

        // Parsear body (puede ser JSON o FormData)
        const contentType = req.headers['content-type'] || '';

        let updateData = {};
        let newImageFile = null;

        if (contentType.includes('multipart/form-data')) {
            // FormData (puede incluir nueva imagen)
            const { files, fields } = await parseMultipart(req);

            if (fields.name) updateData.name = fields.name.trim();
            if (fields.active !== undefined) updateData.active = fields.active === 'true';
            if (fields.display_order) updateData.display_order = parseInt(fields.display_order);

            newImageFile = files.find(f => f.fieldname === 'image');
        } else {
            // JSON
            const body = await parseJSON(req);

            if (body.name !== undefined) updateData.name = body.name.trim();
            if (body.active !== undefined) updateData.active = body.active;
            if (body.display_order !== undefined) updateData.display_order = body.display_order;
        }

        // Si hay nueva imagen, subirla
        if (newImageFile) {
            // Validar tipo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(newImageFile.mimeType)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de imagen no válido'
                });
            }

            // Generar nuevo nombre
            const ext = path.extname(newImageFile.filename) || '.jpg';
            const fileName = `bg_${Date.now()}${ext}`;
            const filePath = `backgrounds/${fileName}`;

            // Subir a Storage
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('backgrounds')
                .upload(filePath, newImageFile.buffer, {
                    contentType: newImageFile.mimeType,
                    upsert: false
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    error: 'Error al subir imagen'
                });
            }

            // Eliminar imagen anterior
            if (existing.file_path) {
                await supabaseAdmin.storage.from('backgrounds').remove([existing.file_path]);
            }

            // Obtener nueva URL
            const { data: urlData } = supabaseAdmin
                .storage
                .from('backgrounds')
                .getPublicUrl(filePath);

            updateData.file_path = filePath;
            updateData.file_url = urlData.publicUrl;
        }

        // Validar que hay algo que actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay datos para actualizar'
            });
        }

        // Actualizar en base de datos
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('backgrounds')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Database update error:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Error al actualizar'
            });
        }

        res.status(200).json({
            success: true,
            data: updated
        });

    } catch (error) {
        console.error('Update background error:', error);
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
