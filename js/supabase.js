/**
 * ===========================================
 * EverMoment - Cliente Supabase
 * Configuración del cliente para frontend
 * ===========================================
 */

// Configuración de Supabase (variables públicas)
const SUPABASE_CONFIG = {
    url: 'https://qnxvjbsljqsmlqttpgjx.supabase.co',  // Cambiar por tu URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFueHZqYnNsanFzbWxxdHRwZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczODM5NzAsImV4cCI6MjA4Mjk1OTk3MH0.vZMXSO_6uqeKq2WGiZ1a24JcB2Ylv7rylDSOYoARCSw'               // Cambiar por tu anon key
};

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

/**
 * Obtener sesión actual
 * @returns {Promise<Object|null>} Sesión del usuario o null
 */
async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

/**
 * Obtener usuario actual
 * @returns {Promise<Object|null>} Usuario actual o null
 */
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

/**
 * Obtener perfil del usuario actual (incluye rol)
 * @returns {Promise<Object|null>} Perfil con rol o null
 */
async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error getting profile:', error);
        return null;
    }
    return data;
}

/**
 * Verificar si el usuario es admin
 * @returns {Promise<boolean>}
 */
async function isAdmin() {
    const profile = await getUserProfile();
    return profile?.role === 'admin';
}

/**
 * Login con email y password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} { user, error }
 */
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { user: null, error };
    }

    return { user: data.user, error: null };
}

/**
 * Logout
 * @returns {Promise<Object>} { error }
 */
async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Obtener token de acceso para API calls
 * @returns {Promise<string|null>}
 */
async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || null;
}

// Exportar para uso global
window.SupabaseClient = {
    supabase,
    getSession,
    getCurrentUser,
    getUserProfile,
    isAdmin,
    signIn,
    signOut,
    getAccessToken
};
