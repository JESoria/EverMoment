/**
 * ===========================================
 * EverMoment Admin - Dashboard
 * Panel principal con estadísticas
 * ===========================================
 */

(function() {
    'use strict';

    const elements = {
        sidebar: document.getElementById('sidebar'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        userAvatar: document.getElementById('user-avatar'),
        userName: document.getElementById('user-name'),
        logoutBtn: document.getElementById('logout-btn'),
        loading: document.getElementById('loading-overlay'),
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toast-icon'),
        toastMessage: document.getElementById('toast-message'),
        // Stats
        totalBackgrounds: document.getElementById('total-backgrounds'),
        activeBackgrounds: document.getElementById('active-backgrounds'),
        inactiveBackgrounds: document.getElementById('inactive-backgrounds')
    };

    /**
     * Mostrar/ocultar loading
     */
    function setLoading(active) {
        if (active) {
            elements.loading.classList.add('show');
        } else {
            elements.loading.classList.remove('show');
        }
    }

    /**
     * Mostrar toast
     */
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
     * Verificar autenticación
     */
    async function checkAuth() {
        setLoading(true);

        try {
            const session = await SupabaseClient.getSession();

            if (!session) {
                window.location.href = 'index.html';
                return false;
            }

            const isAdmin = await SupabaseClient.isAdmin();

            if (!isAdmin) {
                await SupabaseClient.signOut();
                window.location.href = 'index.html';
                return false;
            }

            // Cargar info del usuario
            const user = await SupabaseClient.getCurrentUser();
            if (user) {
                const initial = user.email.charAt(0).toUpperCase();
                elements.userAvatar.textContent = initial;
                elements.userName.textContent = user.email.split('@')[0];
            }

            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'index.html';
            return false;
        }
    }

    /**
     * Cargar estadísticas
     */
    async function loadStats() {
        try {
            // Usar el cliente de Supabase directamente para obtener todos los fondos
            const { data: backgrounds, error } = await SupabaseClient.supabase
                .from('backgrounds')
                .select('id, active');

            if (error) {
                console.error('Error loading stats:', error);
                return;
            }

            const total = backgrounds.length;
            const active = backgrounds.filter(bg => bg.active).length;
            const inactive = total - active;

            elements.totalBackgrounds.textContent = total;
            elements.activeBackgrounds.textContent = active;
            elements.inactiveBackgrounds.textContent = inactive;

        } catch (error) {
            console.error('Stats error:', error);
        }
    }

    /**
     * Cerrar sesión
     */
    async function handleLogout() {
        setLoading(true);

        try {
            await SupabaseClient.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error al cerrar sesión', 'error');
            setLoading(false);
        }
    }

    /**
     * Toggle sidebar en móvil
     */
    function toggleSidebar() {
        elements.sidebar.classList.toggle('open');
    }

    /**
     * Inicialización
     */
    async function init() {
        // Verificar autenticación
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        // Cargar estadísticas
        await loadStats();

        setLoading(false);

        // Event listeners
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.mobileMenuBtn.addEventListener('click', toggleSidebar);

        // Cerrar sidebar al hacer clic fuera en móvil
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 &&
                !elements.sidebar.contains(e.target) &&
                !elements.mobileMenuBtn.contains(e.target)) {
                elements.sidebar.classList.remove('open');
            }
        });
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
