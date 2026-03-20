'use client';

/**
 * Student Management — AD-09
 * CRUD for students by course: manual add, CSV import, list and delete.
 */
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Users, Plus, Trash2, FileSpreadsheet, Search, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    rut: string;
    course_grade: string;
    created_at: string;
}

interface StudentManagementProps {
    onBack?: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onBack }) => {
    const supabase = createClient();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradeFilter, setGradeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState({ first_name: '', last_name: '', rut: '', course_grade: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchStudents(); }, [gradeFilter]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            let query = supabase.from('students').select('*').order('last_name', { ascending: true });
            if (gradeFilter) query = query.eq('course_grade', gradeFilter);
            const { data, error } = await query;
            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Error al cargar alumnos.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async () => {
        if (!newStudent.first_name || !newStudent.last_name || !newStudent.course_grade) {
            toast.error('Nombre, apellido y curso son obligatorios.');
            return;
        }
        const { error } = await supabase.from('students').insert({
            first_name: newStudent.first_name,
            last_name: newStudent.last_name,
            rut: newStudent.rut || '',
            course_grade: newStudent.course_grade,
        });
        if (error) {
            toast.error('Error al agregar alumno.');
            return;
        }
        toast.success('Alumno agregado.');
        setNewStudent({ first_name: '', last_name: '', rut: '', course_grade: '' });
        setShowAddModal(false);
        fetchStudents();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) { toast.error('Error al eliminar.'); return; }
        toast.success('Alumno eliminado.');
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as Record<string, string>[];
                const toInsert = rows
                    .filter(r => r.first_name || r.nombre)
                    .map(r => ({
                        first_name: r.first_name || r.nombre || '',
                        last_name: r.last_name || r.apellido || '',
                        rut: r.rut || '',
                        course_grade: r.course_grade || r.curso || gradeFilter || '',
                    }));

                if (toInsert.length === 0) {
                    toast.error('No se encontraron alumnos v&#225;lidos en el CSV.');
                    return;
                }

                const { error } = await supabase.from('students').insert(toInsert);
                if (error) {
                    toast.error('Error al importar alumnos.');
                    console.error(error);
                    return;
                }
                toast.success(`${toInsert.length} alumnos importados.`);
                fetchStudents();
            },
            error: () => toast.error('Error al leer el archivo CSV.'),
        });
        e.target.value = '';
    };

    const filtered = students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rut.includes(searchTerm)
    );

    const grades = Array.from(new Set(students.map(s => s.course_grade))).sort();

    return (
        <div className="animate-fade-in max-w-7xl mx-auto pb-12 relative -mt-2">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--on-background)] font-[family-name:var(--font-heading)] tracking-tight">Estudiantes</h1>
                <p className="text-[var(--muted)] text-sm md:text-base mt-1">Gestiona listas de alumnos por curso. {students.length} alumnos registrados.</p>
            </div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} accept=".csv" onChange={handleCSVImport} className="hidden" />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)] flex items-center gap-2 text-sm"
                    >
                        <FileSpreadsheet size={16} /> Importar CSV
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm"
                    >
                        <Plus size={16} /> Agregar
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o RUT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm"
                    />
                </div>
                <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm min-w-[150px]"
                >
                    <option value="">Todos los cursos</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <div className="glass-card-premium overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-[var(--muted)]">Cargando...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muted)]">No se encontraron alumnos.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)] bg-[var(--card)]/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] uppercase">Nombre</th>
                                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] uppercase">RUT</th>
                                <th className="px-4 py-3 text-left text-xs text-[var(--muted)] uppercase">Curso</th>
                                <th className="px-4 py-3 text-right text-xs text-[var(--muted)] uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filtered.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-[var(--card-hover)]/50">
                                    <td className="px-4 py-3 text-[var(--muted)]">{idx + 1}</td>
                                    <td className="px-4 py-3 font-medium">{s.last_name}, {s.first_name}</td>
                                    <td className="px-4 py-3 text-[var(--muted)]">{s.rut || '-'}</td>
                                    <td className="px-4 py-3">{s.course_grade}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(s.id)}
                                            className="p-1.5 hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[var(--card)] border border-[var(--border)] w-full max-w-md rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-[var(--on-background)] mb-4">Agregar Alumno</h3>
                        <div className="space-y-3">
                            <input placeholder="Nombre" value={newStudent.first_name} onChange={e => setNewStudent(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm" />
                            <input placeholder="Apellido" value={newStudent.last_name} onChange={e => setNewStudent(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm" />
                            <input placeholder="RUT (opcional)" value={newStudent.rut} onChange={e => setNewStudent(p => ({ ...p, rut: e.target.value }))} className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm" />
                            <input placeholder="Curso (ej: 7&#176; B&#225;sico)" value={newStudent.course_grade} onChange={e => setNewStudent(p => ({ ...p, course_grade: e.target.value }))} className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-sm" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-[var(--border)] text-sm">Cancelar</button>
                            <button onClick={handleAddStudent} className="flex-1 btn-gradient px-4 py-2 rounded-xl text-sm text-white">Agregar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
