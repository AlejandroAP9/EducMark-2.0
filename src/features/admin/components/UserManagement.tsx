'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Users, Search, ChevronLeft, ChevronRight, ArrowLeft, UserPlus, FileSpreadsheet, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';

interface UserRow {
    user_id: string;
    full_name: string;
    email: string;
    role: string;
    institution: string;
    created_at: string;
    plan_type: string;
    status: string;
    remaining_credits: number;
    total_generations: number;
    is_active: boolean;
}

interface SubscriptionRow {
    user_id: string;
    plan_type: string | null;
    status: string | null;
    remaining_credits: number | null;
    total_generations: number | null;
}

const PAGE_SIZE = 10;

export function UserManagement() {
    const supabase = createClient();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    const [newUser, setNewUser] = useState({ full_name: '', email: '', institution: '', plan_type: 'trial' });
    const [creating, setCreating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingCSV, setUploadingCSV] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [page, planFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let countQuery = supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });
            const { count } = await countQuery;
            setTotalCount(count || 0);

            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('user_id, full_name, email, role, institution, created_at, is_active')
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (!profiles) { setUsers([]); setLoading(false); return; }

            const userIds = profiles.map(p => p.user_id).filter(Boolean);
            const { data: subs } = await supabase
                .from('user_subscriptions')
                .select('user_id, plan_type, status, remaining_credits, total_generations')
                .in('user_id', userIds);

            const subMap = new Map<string, SubscriptionRow>();
            (subs as SubscriptionRow[] | null)?.forEach((s) => subMap.set(s.user_id, s));

            const merged: UserRow[] = profiles.map(p => {
                const sub = subMap.get(p.user_id);
                return {
                    ...p,
                    is_active: p.is_active !== false,
                    plan_type: sub?.plan_type || 'trial',
                    status: sub?.status || 'active',
                    remaining_credits: sub?.remaining_credits ?? 0,
                    total_generations: sub?.total_generations ?? 0,
                };
            });

            const filtered = planFilter === 'all'
                ? merged
                : merged.filter(u => u.plan_type?.toLowerCase() === planFilter);

            setUsers(filtered);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.full_name || !newUser.email) {
            toast.error('Nombre y email son obligatorios');
            return;
        }
        setCreating(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-admin-user', {
                body: {
                    full_name: newUser.full_name,
                    email: newUser.email,
                    institution: newUser.institution || null,
                    plan_type: newUser.plan_type || 'trial',
                    role: 'user',
                }
            });
            if (error) throw error;
            if (data?.temporary_password) {
                toast.success(`Usuario creado. Clave temporal: ${data.temporary_password}`);
            } else {
                toast.success('Usuario creado exitosamente');
            }
            setShowNewUserModal(false);
            setNewUser({ full_name: '', email: '', institution: '', plan_type: 'trial' });
            fetchUsers();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear usuario';
            toast.error(message);
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
        const { error } = await supabase
            .from('user_profiles')
            .update({ is_active: !currentlyActive })
            .eq('user_id', userId);

        if (error) {
            toast.error('Error al cambiar estado del usuario.');
            return;
        }
        toast.success(currentlyActive ? 'Usuario desactivado.' : 'Usuario reactivado.');
        fetchUsers();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCSV(true);
        toast.info('Analizando archivo CSV...');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const data = results.data as Record<string, string | null | undefined>[];
                if (data.length === 0) {
                    toast.error('El archivo CSV está vacío');
                    setUploadingCSV(false);
                    return;
                }

                // Batch insert students
                try {
                    const { data: authData } = await supabase.auth.getUser();
                    const importerUserId = authData?.user?.id || null;

                    const studentsToInsert = data.map(row => {
                        const rawName = String(row.full_name || row.nombre || row.Nombre || '').trim();
                        const nameParts = rawName.split(/\s+/).filter(Boolean);
                        const firstName = String(row.first_name || nameParts.slice(0, 1).join('') || '').trim();
                        const lastName = String(row.last_name || row.apellido || row.Apellido || nameParts.slice(1).join(' ') || '').trim();
                        return {
                        rut: row.rut || row.RUT || null,
                        first_name: firstName || 'Desconocido',
                        last_name: lastName || '.',
                        email: row.email || row.Email || null,
                        course_grade: row.course_grade || row.grade || row.curso || row.Curso || 'Desconocido',
                        user_id: importerUserId,
                    };
                    }).filter(s => s.rut && s.first_name);

                    if (studentsToInsert.length === 0) {
                        toast.error('Columnas requeridas no encontradas. Usa al menos RUT y nombre.');
                        setUploadingCSV(false);
                        return;
                    }

                    const { error } = await supabase.from('students').insert(studentsToInsert);
                    if (error) {
                        if (error.code === '23505') {
                            toast.error('Algunos RUTs ya están registrados. Operación cancelada para evitar duplicados.');
                        } else {
                            throw error;
                        }
                    } else {
                        toast.success(`Carga masiva exitosa: ${studentsToInsert.length} estudiantes importados.`);
                    }
                } catch (error: unknown) {
                    console.error('Error importing CSV:', error);
                    const message = error instanceof Error
                        ? error.message
                        : 'Error al importar estudiantes. Asegúrate de tener la tabla migration students activa.';
                    toast.error(message);
                } finally {
                    setUploadingCSV(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: (err) => {
                console.error('PapaParse error:', err);
                toast.error('Error al analizar archivo CSV.');
                setUploadingCSV(false);
            }
        });
    };

    const filteredUsers = searchQuery.length > 1
        ? users.filter(u =>
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : users;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            {/* Back Button */}
            <motion.div variants={item}>
                <button onClick={() => router.push('/dashboard/admin')} className="admin-back-btn">
                    <ArrowLeft size={18} />
                    Volver
                </button>
            </motion.div>

            {/* Header + New User CTA */}
            <motion.div variants={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="admin-page-header" style={{ marginBottom: 0 }}>
                    <div className="header-icon">
                        <Users size={22} />
                    </div>
                    <div>
                        <h1>Gestión de Usuarios</h1>
                        <p>Ver y administrar todos los usuarios de la plataforma</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="admin-back-btn"
                        style={{ margin: 0, padding: '0.75rem 1.5rem', opacity: uploadingCSV ? 0.7 : 1 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingCSV}
                    >
                        <FileSpreadsheet size={18} style={{ marginRight: '0.5rem' }} />
                        {uploadingCSV ? 'Importando...' : 'Importar CSV Alumnos'}
                    </button>
                    <button className="btn-gradient" onClick={() => setShowNewUserModal(true)} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
                        <UserPlus size={18} style={{ marginRight: '0.5rem' }} />
                        Nuevo Usuario
                    </button>
                </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div variants={item} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="admin-search-bar">
                        <Search size={18} style={{ color: 'var(--muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por email o nombre..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="filter-pills">
                        {['all', 'trial', 'copihue', 'araucaria', 'condor'].map(f => (
                            <button
                                key={f}
                                className={`filter-pill ${planFilter === f ? 'active' : ''}`}
                                onClick={() => { setPlanFilter(f); setPage(0); }}
                            >
                                {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div variants={item} className="glass-card-premium" style={{ padding: 0, borderRadius: '1.25rem', overflow: 'hidden' }}>
                <div className="admin-table-header">
                    <span className="table-info">
                        Mostrando {filteredUsers.length} de {totalCount} usuarios
                    </span>
                    <span className="table-info">
                        Página {page + 1} de {totalPages || 1}
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%', margin: '0 auto',
                            border: '4px solid var(--primary)', borderTopColor: 'transparent',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Créditos</th>
                                <th>Generaciones</th>
                                <th>Registro</th>
                                <th>Activo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.user_id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{user.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{user.email}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-proto ${user.plan_type?.toLowerCase() === 'copihue' ? 'orange' : user.plan_type?.toLowerCase() === 'araucaria' ? 'green' : user.plan_type?.toLowerCase() === 'condor' ? 'primary' : 'blue'}`}>
                                            {user.plan_type}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge-proto ${user.status === 'active' ? 'green' : user.status === 'cancelled' ? 'orange' : 'blue'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td>{user.remaining_credits}</td>
                                    <td>{user.total_generations}</td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleToggleActive(user.user_id, user.is_active)}
                                            className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'text-green-500 hover:text-red-400' : 'text-red-400 hover:text-green-500'}`}
                                            title={user.is_active ? 'Desactivar usuario' : 'Reactivar usuario'}
                                        >
                                            {user.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div className="admin-pagination">
                    <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                        <ChevronLeft size={16} />
                    </button>
                    <span className="page-info">Página {page + 1} de {totalPages || 1}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </motion.div>

            {/* New User Modal */}
            {showNewUserModal && (
                <div className="admin-modal-overlay" onClick={() => setShowNewUserModal(false)}>
                    <motion.div
                        className="glass-card-premium admin-modal"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                            <UserPlus size={20} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} />
                            Nuevo Usuario
                        </h2>

                        <div className="admin-form-group">
                            <label>Nombre completo *</label>
                            <input
                                type="text"
                                placeholder="Ej: María García"
                                value={newUser.full_name}
                                onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                            />
                        </div>
                        <div className="admin-form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                placeholder="email@ejemplo.com"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            />
                        </div>
                        <div className="admin-form-group">
                            <label>Institución</label>
                            <input
                                type="text"
                                placeholder="Nombre del colegio o institución"
                                value={newUser.institution}
                                onChange={e => setNewUser({ ...newUser, institution: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button
                                className="admin-back-btn"
                                style={{ margin: 0 }}
                                onClick={() => setShowNewUserModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-gradient"
                                onClick={handleCreateUser}
                                disabled={creating}
                                style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
                            >
                                {creating ? 'Creando...' : 'Crear Usuario'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
