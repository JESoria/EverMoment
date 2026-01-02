/**
 * ===========================================
 * EverMoment - API: Actualizar Background
 * Endpoint admin para actualizar fondo existente
 * ===========================================
 * PUT /api/backgrounds/update?id=<id>
 * Headers: Authorization: Bearer <token>
 * Body: JSON { name, active, display_order } o FormData con 'image'
 */

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const { verifyAdmin, sendAuthError, supabaseAdmin } = require('../middleware/auth');

export const config = {
    api: {
        bodyParser: false,
    },
};

module.exports = async (req, res) => {
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
            const form = formidable({
                maxFileSize: 5 * 1024 * 1024,
            });

            const [fields, files] = await form.parse(req);

            if (fields.name?.[0]) updateData.name = fields.name[0].trim();
            if (fields.active?.[0] !== undefined) updateData.active = fields.active[0] === 'true';
            if (fields.display_order?.[0]) updateData.display_order = parseInt(fields.display_order[0]);

            newImageFile = files.image?.[0];
        } else {
            // JSON
            const chunks = [];
            for await (const chunk of req) {
                chunks.push(chunk);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString());

            if (body.name !== undefined) updateData.name = body.name.trim();
            if (body.active !== undefined) updateData.active = body.active;
            if (body.display_order !== undefined) updateData.display_order = body.display_order;
        }

        // Si hay nueva imagen, subirla
        if (newImageFile) {
            // Validar tipo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(newImageFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de imagen no válido'
                });
            }

            // Generar nuevo nombre
            const ext = path.extname(newImageFile.originalFilename) || '.jpg';
            const fileName = `bg_${Date.now()}${ext}`;
            const filePath = `backgrounds/${fileName}`;

            // Leer y subir
            const fileBuffer = fs.readFileSync(newImageFile.filepath);

            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('backgrounds')
                .upload(filePath, fileBuffer, {
                    contentType: newImageFile.mimetype,
                    upsert: false
                });

            fs.unlink(newImageFile.filepath, () => {});

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
