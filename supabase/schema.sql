-- ===========================================
-- EverMoment - Esquema de Base de Datos
-- ===========================================
-- Ejecutar este script en el SQL Editor de Supabase

-- ============================================
-- 1. TABLA: profiles (extiende auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- 2. TABLA: backgrounds
-- ============================================
CREATE TABLE IF NOT EXISTS public.backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_backgrounds_active ON public.backgrounds(active);
CREATE INDEX IF NOT EXISTS idx_backgrounds_order ON public.backgrounds(display_order);

-- ============================================
-- 3. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para backgrounds
DROP TRIGGER IF EXISTS trigger_backgrounds_updated_at ON public.backgrounds;
CREATE TRIGGER trigger_backgrounds_updated_at
    BEFORE UPDATE ON public.backgrounds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. FUNCIÓN: Auto-crear perfil al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para backgrounds
-- Cualquiera puede ver fondos activos (público)
CREATE POLICY "Anyone can view active backgrounds"
    ON public.backgrounds
    FOR SELECT
    USING (active = true);

-- Admins pueden ver todos los fondos
CREATE POLICY "Admins can view all backgrounds"
    ON public.backgrounds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden insertar fondos
CREATE POLICY "Admins can insert backgrounds"
    ON public.backgrounds
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden actualizar fondos
CREATE POLICY "Admins can update backgrounds"
    ON public.backgrounds
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar fondos
CREATE POLICY "Admins can delete backgrounds"
    ON public.backgrounds
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 6. STORAGE BUCKET (ejecutar en Storage de Supabase)
-- ============================================
-- NOTA: Crear bucket "backgrounds" manualmente en Supabase Dashboard
-- o usar la API de Storage:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('backgrounds', 'backgrounds', true);

-- ============================================
-- 7. CREAR PRIMER ADMIN (después de registrar usuario)
-- ============================================
-- 1. Primero, crear usuario en Authentication > Users de Supabase
-- 2. Copiar el UUID del usuario creado
-- 3. Ejecutar este comando reemplazando el UUID:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
