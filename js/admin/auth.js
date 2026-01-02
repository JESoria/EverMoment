/**
 * ===========================================
 * EverMoment Admin - Autenticación
 * Manejo de login/logout para administradores
 * ===========================================
 */

(function() {
    'use strict';

    const elements = {
        form: document.getElementById('login-form'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        loginBtn: document.getElementById('login-btn'),
        error: document.getElementById('login-error'),
        loading: document.getElementById('loading-overlay')
    };

    /**
     * Mostrar/ocultar loading
     */
    function setLoading(active) {
        if (active) {
            elements.loading.classList.add('show');
            elements.loginBtn.disabled = true;
        } else {
            elements.loading.classList.remove('show');
            elements.loginBtn.disabled = false;
        }
    }

    /**
     * Mostrar error
     */
    function showError(message) {
        elements.error.textContent = message;
        elements.error.classList.add('show');
    }

    /**
     * Ocultar error
     */
    function hideError() {
        elements.error.classList.remove('show');
    }

    /**
     * Verificar si ya hay sesión activa
     */
    async function checkExistingSession() {
        setLoading(true);

        try {
            const session = await SupabaseClient.getSession();

            if (session) {
                // Verificar que sea admin
                const isAdmin = await SupabaseClient.isAdmin();

                if (isAdmin) {
                    window.location.href = '/admin/dashboard.html';
                    return;
                } else {
                    // No es admin, cerrar sesión
                    await SupabaseClient.signOut();
                }
            }
        } catch (error) {
            console.error('Session check error:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Manejar submit del formulario
     */
    async function handleLogin(e) {
        e.preventDefault();
        hideError();
        setLoading(true);

        const email = elements.email.value.trim();
        const password = elements.password.value;

        if (!email || !password) {
            showError('Por favor, completa todos los campos');
            setLoading(false);
            return;
        }

        try {
            // Intentar login
            const { user, error } = await SupabaseClient.signIn(email, password);

            if (error) {
                let errorMessage = 'Error al iniciar sesión';

                if (error.message.includes('Invalid login')) {
                    errorMessage = 'Correo o contraseña incorrectos';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Debes confirmar tu correo electrónico';
                }

                showError(errorMessage);
                setLoading(false);
                return;
            }

            // Verificar que sea admin
            const isAdmin = await SupabaseClient.isAdmin();

            if (!isAdmin) {
                showError('Acceso denegado. No tienes permisos de administrador.');
                await SupabaseClient.signOut();
                setLoading(false);
                return;
            }

            // Redirigir al dashboard
            window.location.href = '/admin/dashboard.html';

        } catch (error) {
            console.error('Login error:', error);
            showError('Error de conexión. Intenta de nuevo.');
            setLoading(false);
        }
    }

    /**
     * Inicialización
     */
    function init() {
        // Verificar sesión existente
        checkExistingSession();

        // Event listener para el formulario
        elements.form.addEventListener('submit', handleLogin);

        // Limpiar error al escribir
        elements.email.addEventListener('input', hideError);
        elements.password.addEventListener('input', hideError);
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
