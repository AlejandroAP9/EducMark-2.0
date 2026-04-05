'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptionStore } from '@/features/auth/store/subscriptionStore';
import { toast } from 'sonner';
import {
    FlaskConical, Calculator, BookOpen, Scroll, Palette, Music, Monitor, Trophy,
    Camera, Save, Lock, User, Mail, Building2, BookUser, CheckCircle2, Crown,
    Presentation, Timer, Files, X, ChevronDown, Upload, Eye, Trash2,
    Image as ImageIcon
} from 'lucide-react';

// Subject-themed Avatars using Lucide Icons
const AVATARS = [
    { id: '1', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', label: 'Ciencias' },
    { id: '2', icon: Calculator, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Matemáticas' },
    { id: '3', icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'Literatura' },
    { id: '4', icon: Scroll, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Historia' },
    { id: '5', icon: Palette, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Arte' },
    { id: '6', icon: Music, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Música' },
    { id: '7', icon: Monitor, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'Tecnología' },
    { id: '8', icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Deportes' },
];

export function Profile() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        surname: '',
        email: '',
        institution: '',
        subjects: [] as string[],
        avatar_id: '1',
        title: 'Profesor/a',
        role: ''
    });
    const [newSubject, setNewSubject] = useState('');
    const [stats, setStats] = useState({ timeSaved: 0, kitsGenerated: 0, subjectCount: 0 });
    const { planName } = useSubscriptionStore();

    // Branding state
    const [institutionLogoUrl, setInstitutionLogoUrl] = useState<string | null>(null);
    const [institutionDisplayName, setInstitutionDisplayName] = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const [isDraggingLogo, setIsDraggingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getProfile().catch(() => toast.error('Error al cargar perfil'));
        getStats().catch(() => toast.error('Error al cargar estadisticas'));
    }, []);

    const getStats = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch Stats
        const { count } = await supabase
            .from('generated_classes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id);

        const kits = count || 0;
        setStats({
            timeSaved: kits * 45,
            kitsGenerated: kits,
            subjectCount: profile.subjects.length
        });
    };

    const getProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Try to fetch from DB
        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

        let dbProfile = {};
        if (data) {
            const nameParts = (data.full_name || '').split(' ');
            // Handle case where split might result in empty strings if full_name is empty
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            dbProfile = {
                name: firstName,
                surname: lastName,
                institution: data.institution || '',
                subjects: data.subjects || [],
                avatar_id: data.avatar_url || '1',
                title: data.role || 'Profesor/a',
                email: session.user.email
            };
        } else {
            // New user, defaults from Metadata
            const metaName = session.user.user_metadata?.full_name || '';
            const nameParts = metaName.split(' ');
            const firstName = nameParts[0] || session.user.email?.split('@')[0] || 'Usuario';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            dbProfile = {
                email: session.user.email,
                name: firstName,
                surname: lastName,
                institution: '',
                subjects: [],
                avatar_id: '1',
                title: 'Profesor/a'
            };
        }

        setProfile(prev => ({
            ...prev,
            ...dbProfile
        }));

        // Load branding fields
        if (data) {
            setInstitutionLogoUrl(data.institution_logo_url || null);
            setInstitutionDisplayName(data.institution_display_name || '');
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const fullName = `${profile.name} ${profile.surname}`.trim();

        // Save to DB
        const updates = {
            user_id: session.user.id,
            full_name: fullName,
            institution: profile.institution,
            subjects: profile.subjects,
            avatar_url: profile.avatar_id,
            role: profile.title, // Save title to role column
            email: session.user.email, // Required for upsert if row missing
            institution_logo_url: institutionLogoUrl,
            institution_display_name: institutionDisplayName || null,
            updated_at: new Date()
        };

        const { error } = await supabase.from('user_profiles').upsert(updates, { onConflict: 'user_id' });

        setLoading(false);
        if (error) {
            console.error('Error updating profile:', error);
            toast.error('Error al guardar los cambios: ' + error.message);
        } else {
            toast.success('¡Cambios guardados exitosamente!');
        }
    };

    const updatePassword = async () => {
        if (password.length < 8) return toast.error('La contraseña debe tener al menos 8 caracteres');
        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            return toast.error('La contraseña debe incluir al menos una mayúscula y un número');
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });
        setLoading(false);

        if (error) toast.error(error.message);
        else {
            toast.success('Contraseña actualizada correctamente');
            setShowPasswordModal(false);
            setPassword('');
        }
    };

    const handleAddSubject = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSubject.trim()) {
            if (!profile.subjects.includes(newSubject.trim())) {
                setProfile(prev => ({
                    ...prev,
                    subjects: [...(prev.subjects || []), newSubject.trim()]
                }));
            }
            setNewSubject('');
        }
    };

    const removeSubject = (subjectToRemove: string) => {
        setProfile(prev => ({
            ...prev,
            subjects: prev.subjects.filter(s => s !== subjectToRemove)
        }));
    };

    // --- Logo upload handlers ---
    const handleLogoFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona una imagen válida (PNG, JPG, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error('El archivo es muy grande. Máximo 2MB.');
            return;
        }

        setLogoUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { toast.error('Sesión expirada'); return; }

            const ext = file.name.split('.').pop() || 'png';
            const path = `${session.user.id}/logo.${ext}`;

            // Upload (upsert to overwrite previous)
            const { error: uploadError } = await supabase.storage
                .from('institution-logos')
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                toast.error('Error al subir el logo: ' + uploadError.message);
                return;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('institution-logos')
                .getPublicUrl(path);

            // Append cache-buster so the browser shows the new image
            const publicUrl = urlData.publicUrl + '?t=' + Date.now();
            setInstitutionLogoUrl(publicUrl);
            toast.success('Logo subido correctamente');
        } catch (err) {
            console.error(err);
            toast.error('Error inesperado al subir el logo');
        } finally {
            setLogoUploading(false);
        }
    };

    const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleLogoFile(file);
    };

    const handleLogoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingLogo(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleLogoFile(file);
    };

    const handleRemoveLogo = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Try to remove from storage (best effort)
        await supabase.storage.from('institution-logos').remove([`${session.user.id}/logo.png`, `${session.user.id}/logo.jpg`, `${session.user.id}/logo.jpeg`, `${session.user.id}/logo.webp`]);

        setInstitutionLogoUrl(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
        toast.success('Logo eliminado');
    };

    // Helper to get current avatar object
    const currentAvatar = AVATARS.find(a => a.id === profile.avatar_id) || AVATARS[0];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-12 relative -mt-2">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2"></div>

            {/* Header Card */}
            <div className="glass-card-premium rounded-3xl p-6 md:p-8 mb-8 relative overflow-hidden group">
                <div className="neural-bg opacity-40">
                    <div className="neural-orb orb-1" style={{ width: '150px', height: '150px', top: '-30px', right: '-30px' }}></div>
                    <div className="neural-orb orb-2" style={{ width: '100px', height: '100px', bottom: '-20px', left: '20%' }}></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                    <div className="relative group/avatar cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[var(--card)] shadow-[0_0_30px_rgba(164,143,255,0.3)] overflow-hidden bg-[var(--card)] flex items-center justify-center transition-transform duration-300 group-hover/avatar:scale-105 ${currentAvatar.bg}`}>
                            <currentAvatar.icon size={64} className={`${currentAvatar.color}`} />
                        </div>
                        <button className="absolute bottom-0 right-0 bg-[var(--primary)] text-white p-2 rounded-full shadow-lg border-2 border-[var(--card)] hover:bg-[var(--primary-hover)] transition-colors group-hover/avatar:scale-110">
                            <Camera size={20} />
                        </button>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-bg)] border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1 shadow-sm">
                            <Crown size={14} className="fill-current" />
                            {planName}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">
                            {profile.title} {profile.name} {profile.surname}
                        </h1>
                        <p className="text-[var(--muted)] text-lg flex items-center justify-center md:justify-start gap-2">
                            <Presentation size={24} className="text-[var(--primary)]" />
                            {profile.institution}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button className="btn-gradient px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 group/btn" onClick={updateProfile}>
                            <Save size={20} className="group-hover/btn:animate-bounce" />
                            <span>Guardar Cambios</span>
                        </button>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="bg-[var(--card)]/50 backdrop-blur-sm border border-[var(--border)] text-[var(--on-background)] px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--card-hover)] transition-colors"
                        >
                            <Lock size={20} />
                            <span>Contraseña</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-[var(--card)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <h2 className="text-xl font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center text-[var(--primary)]">
                                <User size={20} />
                            </div>
                            Información Personal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                            <div className="form-group space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Nombre</label>
                                <div className="relative group input-group">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="form-group space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Apellido</label>
                                <div className="relative group input-group">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    <input
                                        type="text"
                                        name="surname"
                                        value={profile.surname}
                                        onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="form-group space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Título / Cargo</label>
                                <div className="relative group input-group">
                                    <Presentation size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    <select
                                        name="title"
                                        value={profile.title}
                                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all appearance-none cursor-pointer"
                                    >
                                        <option>Profesor/a</option>
                                        <option>Jefe UTP</option>
                                        <option>Director/a</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div className="form-group space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Correo Electrónico</label>
                                <div className="relative input-group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--muted)] cursor-not-allowed opacity-70"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)] flex items-center gap-1 text-xs font-medium bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-full border border-[rgba(16,185,129,0.2)]">
                                        <CheckCircle2 size={12} className="fill-current" /> Verificado
                                    </div>
                                </div>
                            </div>

                            <div className="form-group space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Institución Educativa</label>
                                <div className="relative group input-group">
                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    <input
                                        type="text"
                                        value={profile.institution}
                                        onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                                        placeholder="Escuela / Colegio / Liceo"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-[var(--card)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <h2 className="text-xl font-bold text-[var(--on-background)] mb-6 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <BookUser size={20} />
                            </div>
                            Asignaturas que impartes
                        </h2>

                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {(profile.subjects || []).map((subject, index) => (
                                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary-bg)] text-[var(--primary)] text-sm font-medium border border-[var(--primary)]/20 animate-fade-in">
                                        {subject}
                                        <button onClick={() => removeSubject(subject)} className="hover:text-[var(--danger)] transition-colors">
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        onKeyDown={handleAddSubject}
                                        placeholder="+ Agregar asignatura..."
                                        className="bg-transparent border border-dashed border-[var(--border)] rounded-lg px-3 py-1.5 text-sm text-[var(--on-background)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--input-bg)] transition-all w-full sm:w-48"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-[var(--muted)] ml-1">
                                Presiona <kbd className="font-sans bg-[var(--card)] border border-[var(--border)] rounded px-1">Enter</kbd> para agregar una nueva asignatura.
                            </p>
                        </div>
                    </section>

                    {/* Branding Institucional */}
                    <section className="bg-[var(--card)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 md:p-8 relative overflow-hidden">
                        <h2 className="text-xl font-bold text-[var(--on-background)] mb-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Building2 size={20} />
                            </div>
                            Branding Institucional
                        </h2>
                        <p className="text-sm text-[var(--muted)] mb-6 ml-10">
                            Tu logo y nombre aparecerán en todos los documentos exportados
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Logo Institucional (opcional)</label>

                                {institutionLogoUrl ? (
                                    <div className="relative w-32 h-32 border-2 border-[var(--border)] rounded-xl overflow-hidden bg-white/5 group/logo">
                                        <img
                                            src={institutionLogoUrl}
                                            alt="Logo institucional"
                                            className="w-full h-full object-contain p-2"
                                        />
                                        <button
                                            onClick={handleRemoveLogo}
                                            className="absolute top-1.5 right-1.5 p-1.5 bg-red-500/90 text-white rounded-full opacity-0 group-hover/logo:opacity-100 hover:bg-red-600 transition-all shadow-lg"
                                            title="Eliminar logo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onDrop={handleLogoDrop}
                                        onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                                        onDragLeave={() => setIsDraggingLogo(false)}
                                        onClick={() => logoInputRef.current?.click()}
                                        className={`
                                            w-32 h-32 border-2 border-dashed rounded-xl
                                            flex flex-col items-center justify-center cursor-pointer
                                            transition-all duration-200
                                            ${isDraggingLogo
                                                ? 'border-[var(--primary)] bg-[var(--primary-bg)]'
                                                : 'border-[var(--border)] hover:border-[var(--muted)] bg-[var(--input-bg)]'
                                            }
                                            ${logoUploading ? 'opacity-50 pointer-events-none' : ''}
                                        `}
                                    >
                                        {logoUploading ? (
                                            <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
                                        ) : (
                                            <>
                                                <Upload size={22} className="text-[var(--muted)] mb-1.5" />
                                                <span className="text-xs text-[var(--muted)] text-center px-2">
                                                    Arrastra o haz clic
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}

                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoInputChange}
                                    className="hidden"
                                />
                                <p className="text-xs text-[var(--muted)] ml-1">PNG, JPG hasta 2MB</p>
                            </div>

                            {/* Institution Display Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[var(--muted)] ml-1">Nombre para documentos</label>
                                <div className="relative group input-group">
                                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                                    <input
                                        type="text"
                                        value={institutionDisplayName}
                                        onChange={(e) => setInstitutionDisplayName(e.target.value)}
                                        placeholder="Ej: Colegio San José de la Providencia"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                                    />
                                </div>
                                <p className="text-xs text-[var(--muted)] ml-1">
                                    Si no lo defines, se usará el nombre de tu institución del perfil.
                                </p>
                            </div>
                        </div>

                        {/* Vista previa */}
                        {(institutionLogoUrl || institutionDisplayName || profile.institution) && (
                            <div className="mt-6 pt-6 border-t border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Eye size={16} className="text-[var(--muted)]" />
                                    <span className="text-sm font-medium text-[var(--muted)]">Vista previa en documentos</span>
                                </div>
                                <div className="bg-white rounded-xl p-4 inline-flex items-center gap-4 shadow-sm border border-gray-100">
                                    {institutionLogoUrl ? (
                                        <img
                                            src={institutionLogoUrl}
                                            alt="Logo"
                                            className="w-12 h-12 object-contain rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                                            <ImageIcon size={20} className="text-gray-300" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {institutionDisplayName || profile.institution || 'Nombre de tu institución'}
                                        </p>
                                        <p className="text-xs text-gray-400">Evaluación Sumativa — Historia 7° Básico</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="glass-card-premium rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--primary)] transition-colors">
                        <div className="neural-bg opacity-10">
                            <div className="neural-orb orb-1" style={{ background: '#10b981' }}></div>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-2xl mb-1 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <Timer size={32} className="fill-current/20" />
                            </div>
                            <div>
                                <p className="text-[var(--muted)] text-sm font-medium">Tiempo Ahorrado</p>
                                <h3 className="text-2xl font-bold text-[var(--on-background)]">
                                    {Math.round(stats.timeSaved / 60)} horas
                                </h3>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <p className="text-xs text-[var(--muted)]">Calculado en base a {stats.kitsGenerated} kits generados.</p>
                        </div>
                    </div>

                    <div className="glass-card-premium rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--primary)] transition-colors">
                        <div className="neural-bg opacity-10">
                            <div className="neural-orb orb-1" style={{ background: '#3b82f6' }}></div>
                        </div>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-2xl mb-1 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                <Files size={32} className="fill-current/20" />
                            </div>
                            <div>
                                <p className="text-[var(--muted)] text-sm font-medium">Kits Generados</p>
                                <h3 className="text-2xl font-bold text-[var(--on-background)]">
                                    {stats.kitsGenerated} Kits
                                </h3>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <p className="text-xs text-[var(--muted)]">Has creado contenido para <span className="text-blue-500 font-bold">{(profile.subjects || []).length} asignaturas</span> diferentes.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Avatar Selection Modal */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-scale-in">
                        <button
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-[var(--on-background)] mb-1">Elige tu Avatar</h3>
                        <p className="text-sm text-[var(--muted)] mb-6">Selecciona un icono que represente tu estilo de enseñanza.</p>

                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {AVATARS.map((avatar) => (
                                <button
                                    key={avatar.id}
                                    onClick={() => {
                                        setProfile(prev => ({ ...prev, avatar_id: avatar.id }));
                                        setShowAvatarModal(false);
                                    }}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all border-2 ${profile.avatar_id === avatar.id ? 'border-[var(--primary)] bg-[var(--primary-bg)] text-[var(--primary)] shadow-lg shadow-purple-500/20' : 'border-transparent hover:bg-[var(--card-hover)] text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                                >
                                    <avatar.icon size={32} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-in">
                        <h3 className="text-xl font-bold text-[var(--on-background)] mb-4">Cambiar Contraseña</h3>
                        <div className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nueva contraseña (min. 6 caracteres)"
                                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--card-hover)] transition-colors">Cancelar</button>
                            <button onClick={updatePassword} className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-500/20 hover:bg-[var(--primary-hover)]">
                                {loading ? 'Actualizando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
