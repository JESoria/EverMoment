/**
 * ===========================================
 * EverMoment - API: Eliminar Background
 * Endpoint admin para eliminar fondo
 * ===========================================
 * DELETE /api/backgrounds/delete?id=<id>
 * Headers: Authorization: Bearer <token>
 */

const { verifyAdmin, sendAuthError, supabaseAdmin } = require('../middleware/auth');

module.exports = async (req, res) => {
    // Solo permitir DELETE
    if (req.method !== 'DELETE') {
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
        // Obtener fondo existente
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

        // Eliminar archivo de Storage
        if (existing.file_path) {
            const { error: storageError } = await supabaseAdmin
                .storage
                .from('backgrounds')
                .remove([existing.file_path]);

            if (storageError) {
                console.error('Storage delete error:', storageError);
                // Continuar con la eliminación de DB aunque falle Storage
            }
        }

        // Eliminar de base de datos
        const { error: deleteError } = await supabaseAdmin
            .from('backgrounds')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Database delete error:', deleteError);
            return res.status(500).json({
                success: false,
                error: 'Error al eliminar de base de datos'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Fondo eliminado correctamente'
        });

    } catch (error) {
        console.error('Delete background error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
