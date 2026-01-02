/**
 * ===========================================
 * EverMoment - Middleware de Autenticación
 * Verifica JWT y rol de admin para endpoints protegidos
 * ===========================================
 */

const { createClient } = require('@supabase/supabase-js');

// Cliente Supabase con service role (acceso total)
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extraer token del header Authorization
 * @param {Object} req - Request object
 * @returns {string|null} Token o null
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Verificar que el usuario está autenticado
 * @param {Object} req - Request object
 * @returns {Promise<Object>} { user, error }
 */
async function verifyAuth(req) {
    const token = extractToken(req);

    if (!token) {
        return {
            user: null,
            error: { message: 'Token no proporcionado', status: 401 }
        };
    }

    try {
        // Verificar token JWT con Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return {
                user: null,
                error: { message: 'Token inválido o expirado', status: 401 }
            };
        }

        return { user, error: null };
    } catch (err) {
        console.error('Auth verification error:', err);
        return {
            user: null,
            error: { message: 'Error al verificar autenticación', status: 500 }
        };
    }
}

/**
 * Verificar que el usuario es admin
 * @param {Object} req - Request object
 * @returns {Promise<Object>} { user, profile, error }
 */
async function verifyAdmin(req) {
    // Primero verificar autenticación
    const { user, error: authError } = await verifyAuth(req);

    if (authError) {
        return { user: null, profile: null, error: authError };
    }

    try {
        // Obtener perfil y verificar rol
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return {
                user: null,
                profile: null,
                error: { message: 'Perfil no encontrado', status: 403 }
            };
        }

        if (profile.role !== 'admin') {
            return {
                user: null,
                profile: null,
                error: { message: 'Acceso denegado. Se requiere rol de administrador.', status: 403 }
            };
        }

        return { user, profile, error: null };
    } catch (err) {
        console.error('Admin verification error:', err);
        return {
            user: null,
            profile: null,
            error: { message: 'Error al verificar permisos', status: 500 }
        };
    }
}

/**
 * Responder con error de autenticación
 * @param {Object} res - Response object
 * @param {Object} error - Error object con message y status
 */
function sendAuthError(res, error) {
    res.status(error.status || 401).json({
        success: false,
        error: error.message
    });
}

module.exports = {
    supabaseAdmin,
    extractToken,
    verifyAuth,
    verifyAdmin,
    sendAuthError
};
