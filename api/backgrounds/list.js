/**
 * ===========================================
 * EverMoment - API: Listar Backgrounds
 * Endpoint público para obtener fondos activos
 * ===========================================
 * GET /api/backgrounds/list
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Solo permitir GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Método no permitido'
        });
    }

    try {
        // Cliente Supabase con anon key (respeta RLS)
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Obtener fondos activos ordenados por display_order
        const { data: backgrounds, error } = await supabase
            .from('backgrounds')
            .select('id, name, file_url, display_order')
            .eq('active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error al obtener fondos'
            });
        }

        // Transformar para compatibilidad con frontend
        const formattedBackgrounds = backgrounds.map(bg => ({
            id: `bg-${bg.id}`,
            dbId: bg.id,
            name: bg.name,
            url: bg.file_url,
            thumbnail: bg.file_url,
            displayOrder: bg.display_order
        }));

        res.status(200).json({
            success: true,
            data: formattedBackgrounds
        });

    } catch (error) {
        console.error('List backgrounds error:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
