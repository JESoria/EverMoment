/**
 * ===========================================
 * EverMoment Admin - Gestión de Fondos
 * CRUD completo con drag & drop (SortableJS)
 * ===========================================
 */

(function() {
    'use strict';

    // Estado
    let backgrounds = [];
    let editingId = null;
    let deletingId = null;
    let selectedFile = null;

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
        // Table
        tbody: document.getElementById('backgrounds-tbody'),
        emptyState: document.getElementById('empty-state'),
        addBtn: document.getElementById('add-btn'),
        addFirstBtn: document.getElementById('add-first-btn'),
        // Modal
        modalOverlay: document.getElementById('modal-overlay'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        modalCancel: document.getElementById('modal-cancel'),
        form: document.getElementById('background-form'),
        bgName: document.getElementById('bg-name'),
        bgFile: document.getElementById('bg-file'),
        bgActive: document.getElementById('bg-active'),
        fileUploadArea: document.getElementById('file-upload-area'),
        filePreview: document.getElementById('file-preview'),
        // Delete Modal
        deleteModal: document.getElementById('delete-modal'),
        deleteModalClose: document.getElementById('delete-modal-close'),
        deleteBgName: document.getElementById('delete-bg-name'),
        deleteCancel: document.getElementById('delete-cancel'),
        deleteConfirm: document.getElementById('delete-confirm')
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
     * Obtener token de acceso
     */
    async function getAuthHeaders() {
        const token = await SupabaseClient.getAccessToken();
        return {
            'Authorization': `Bearer ${token}`
        };
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
     * Cargar fondos
     */
    async function loadBackgrounds() {
        try {
            // Usar Supabase directamente para obtener todos los fondos
            const { data, error } = await SupabaseClient.supabase
                .from('backgrounds')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) {
                console.error('Error loading backgrounds:', error);
                showToast('Error al cargar fondos', 'error');
                return;
            }

            backgrounds = data || [];
            renderTable();

        } catch (error) {
            console.error('Load backgrounds error:', error);
            showToast('Error de conexión', 'error');
        }
    }

    /**
     * Renderizar tabla
     */
    function renderTable() {
        if (backgrounds.length === 0) {
            elements.tbody.innerHTML = '';
            elements.emptyState.style.display = 'block';
            return;
        }

        elements.emptyState.style.display = 'none';

        elements.tbody.innerHTML = backgrounds.map(bg => `
            <tr data-id="${bg.id}">
                <td>
                    <span class="drag-handle material-icons-round">drag_indicator</span>
                </td>
                <td>
                    <img src="${bg.file_url}" alt="${bg.name}" class="bg-preview"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 100%22%3E%3Crect fill=%22%23003366%22 width=%2280%22 height=%22100%22/%3E%3C/svg%3E'">
                </td>
                <td><strong>${escapeHtml(bg.name)}</strong></td>
                <td>
                    <span class="status-badge ${bg.active ? 'active' : 'inactive'}">
                        <span class="material-icons-round" style="font-size: 14px;">
                            ${bg.active ? 'visibility' : 'visibility_off'}
                        </span>
                        ${bg.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn btn-secondary btn-icon" onclick="editBackground(${bg.id})" title="Editar">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="btn btn-${bg.active ? 'warning' : 'success'} btn-icon"
                                onclick="toggleActive(${bg.id})" title="${bg.active ? 'Desactivar' : 'Activar'}">
                            <span class="material-icons-round">${bg.active ? 'visibility_off' : 'visibility'}</span>
                        </button>
                        <button class="btn btn-danger btn-icon" onclick="confirmDelete(${bg.id})" title="Eliminar">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Inicializar SortableJS
        initSortable();
    }

    /**
     * Escapar HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inicializar SortableJS
     */
    function initSortable() {
        new Sortable(elements.tbody, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'dragging',
            onEnd: async function(evt) {
                const newOrder = [];
                const rows = elements.tbody.querySelectorAll('tr');

                rows.forEach((row, index) => {
                    newOrder.push({
                        id: parseInt(row.dataset.id),
                        display_order: index
                    });
                });

                // Actualizar orden en base de datos
                await updateDisplayOrder(newOrder);
            }
        });
    }

    /**
     * Actualizar orden en base de datos
     */
    async function updateDisplayOrder(newOrder) {
        try {
            const headers = await getAuthHeaders();

            // Actualizar cada fondo
            for (const item of newOrder) {
                await fetch(`/api/backgrounds/update?id=${item.id}`, {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ display_order: item.display_order })
                });
            }

            // Actualizar estado local
            newOrder.forEach(item => {
                const bg = backgrounds.find(b => b.id === item.id);
                if (bg) bg.display_order = item.display_order;
            });

            showToast('Orden actualizado', 'success');

        } catch (error) {
            console.error('Update order error:', error);
            showToast('Error al actualizar orden', 'error');
            loadBackgrounds(); // Recargar para restaurar
        }
    }

    /**
     * Abrir modal para nuevo fondo
     */
    function openNewModal() {
        editingId = null;
        selectedFile = null;
        elements.modalTitle.textContent = 'Nuevo Fondo';
        elements.form.reset();
        elements.bgActive.checked = true;
        elements.filePreview.style.display = 'none';
        elements.fileUploadArea.classList.remove('has-file');
        elements.modalOverlay.classList.add('show');
    }

    /**
     * Abrir modal para editar fondo
     */
    window.editBackground = function(id) {
        const bg = backgrounds.find(b => b.id === id);
        if (!bg) return;

        editingId = id;
        selectedFile = null;
        elements.modalTitle.textContent = 'Editar Fondo';
        elements.bgName.value = bg.name;
        elements.bgActive.checked = bg.active;

        // Mostrar preview de imagen actual
        elements.filePreview.src = bg.file_url;
        elements.filePreview.style.display = 'block';
        elements.fileUploadArea.classList.add('has-file');

        elements.modalOverlay.classList.add('show');
    };

    /**
     * Cerrar modal
     */
    function closeModal() {
        elements.modalOverlay.classList.remove('show');
        editingId = null;
        selectedFile = null;
    }

    /**
     * Manejar selección de archivo
     */
    function handleFileSelect(file) {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Formato no válido. Use JPG, PNG o WebP.', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('La imagen es muy grande. Máximo 5MB.', 'error');
            return;
        }

        selectedFile = file;

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.filePreview.src = e.target.result;
            elements.filePreview.style.display = 'block';
            elements.fileUploadArea.classList.add('has-file');
        };
        reader.readAsDataURL(file);
    }

    /**
     * Guardar fondo
     */
    async function saveBackground(e) {
        e.preventDefault();
        setLoading(true);

        try {
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('name', elements.bgName.value.trim());
            formData.append('active', elements.bgActive.checked);

            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            let url, method;

            if (editingId) {
                url = `/api/backgrounds/update?id=${editingId}`;
                method = 'PUT';
            } else {
                url = '/api/backgrounds/create';
                method = 'POST';

                if (!selectedFile) {
                    showToast('La imagen es requerida', 'error');
                    setLoading(false);
                    return;
                }
            }

            const response = await fetch(url, {
                method,
                headers,
                body: formData
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error al guardar');
            }

            closeModal();
            await loadBackgrounds();
            showToast(editingId ? 'Fondo actualizado' : 'Fondo creado', 'success');

        } catch (error) {
            console.error('Save background error:', error);
            showToast(error.message || 'Error al guardar', 'error');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Toggle activo/inactivo
     */
    window.toggleActive = async function(id) {
        const bg = backgrounds.find(b => b.id === id);
        if (!bg) return;

        setLoading(true);

        try {
            const headers = await getAuthHeaders();

            const response = await fetch(`/api/backgrounds/update?id=${id}`, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ active: !bg.active })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error al actualizar');
            }

            bg.active = !bg.active;
            renderTable();
            showToast(bg.active ? 'Fondo activado' : 'Fondo desactivado', 'success');

        } catch (error) {
            console.error('Toggle active error:', error);
            showToast('Error al actualizar', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Mostrar confirmación de eliminación
     */
    window.confirmDelete = function(id) {
        const bg = backgrounds.find(b => b.id === id);
        if (!bg) return;

        deletingId = id;
        elements.deleteBgName.textContent = bg.name;
        elements.deleteModal.classList.add('show');
    };

    /**
     * Cerrar modal de eliminación
     */
    function closeDeleteModal() {
        elements.deleteModal.classList.remove('show');
        deletingId = null;
    }

    /**
     * Confirmar eliminación
     */
    async function deleteBackground() {
        if (!deletingId) return;

        setLoading(true);
        closeDeleteModal();

        try {
            const headers = await getAuthHeaders();

            const response = await fetch(`/api/backgrounds/delete?id=${deletingId}`, {
                method: 'DELETE',
                headers
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Error al eliminar');
            }

            await loadBackgrounds();
            showToast('Fondo eliminado', 'success');

        } catch (error) {
            console.error('Delete background error:', error);
            showToast('Error al eliminar', 'error');
        } finally {
            setLoading(false);
            deletingId = null;
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

        // Cargar fondos
        await loadBackgrounds();

        setLoading(false);

        // Event listeners
        elements.logoutBtn.addEventListener('click', handleLogout);
        elements.mobileMenuBtn.addEventListener('click', toggleSidebar);

        // Modal handlers
        elements.addBtn.addEventListener('click', openNewModal);
        elements.addFirstBtn.addEventListener('click', openNewModal);
        elements.modalClose.addEventListener('click', closeModal);
        elements.modalCancel.addEventListener('click', closeModal);
        elements.form.addEventListener('submit', saveBackground);

        // File upload
        elements.fileUploadArea.addEventListener('click', () => elements.bgFile.click());
        elements.bgFile.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

        // Drag & drop file
        elements.fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.fileUploadArea.style.borderColor = 'var(--azul-anil)';
        });
        elements.fileUploadArea.addEventListener('dragleave', () => {
            elements.fileUploadArea.style.borderColor = '';
        });
        elements.fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.fileUploadArea.style.borderColor = '';
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });

        // Delete modal handlers
        elements.deleteModalClose.addEventListener('click', closeDeleteModal);
        elements.deleteCancel.addEventListener('click', closeDeleteModal);
        elements.deleteConfirm.addEventListener('click', deleteBackground);

        // Cerrar modales al hacer clic fuera
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) closeModal();
        });
        elements.deleteModal.addEventListener('click', (e) => {
            if (e.target === elements.deleteModal) closeDeleteModal();
        });

        // Cerrar sidebar en móvil
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
