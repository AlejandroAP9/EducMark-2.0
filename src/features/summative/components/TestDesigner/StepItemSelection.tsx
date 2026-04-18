'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Sparkles, Wand2, RefreshCw, Mail, Check, Save, Download, Trash2, ArrowUp, ArrowDown, Pencil, X, Heart, ImagePlus, Printer, Clock, FileText, MoreVertical, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/UIComponents';
import { Modal } from '@/shared/components/ui/UIComponents';
import { LatexInlineRenderer } from '../shared/LatexInlineRenderer';
import { useItemSelection } from '@/features/summative/hooks/useItemSelection';
import type { GeneratedItem } from '@/features/summative/hooks/useItemSelection';

interface StepItemSelectionProps {
    onFinalize: () => void;
}

export const StepItemSelection: React.FC<StepItemSelectionProps> = ({ onFinalize }) => {
    const [actionsOpen, setActionsOpen] = useState(false);
    const [openKebabId, setOpenKebabId] = useState<number | null>(null);
    const actionsRef = useRef<HTMLDivElement | null>(null);
    const kebabRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
                setActionsOpen(false);
            }
            if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
                setOpenKebabId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const {
        // Constants
        LOADING_MESSAGES,
        EDUCATIONAL_TIPS,
        COGNITIVE_SKILLS,

        // Store data
        blueprint,
        selectedItems,
        setSelectedItems,
        testData,
        items,

        // State
        generating,
        generated,
        showBankModal,
        bankLoading,
        bankQuery,
        setBankQuery,
        selectedBankItemIds,
        editingItemId,
        setEditingItemId,
        skillFilter,
        setSkillFilter,
        draggingIndex,
        setDraggingIndex,
        bankTabFilter,
        setBankTabFilter,
        togglingFav,
        editingSkillId,
        setEditingSkillId,
        stimulusText,
        setStimulusText,
        showStimulusInput,
        setShowStimulusInput,

        // Loader states
        elapsedTime,
        loadingStage,
        loadingProgress,
        currentTip,

        // Computed
        totalQuestions,
        currentCount,
        progress,
        itemsBySkill,
        skillOptions,
        filteredItems,
        filteredBankItems,

        // Helpers
        formatTime,

        // Handlers
        handleGenerate,
        handleFinalizeAction,
        handleSaveToBank,
        handleImportFromBank,
        handleConfirmBankImport,
        handlePrintEvaluation,
        handleItemFieldChange,
        handleImageUpload,
        handleItemOptionChange,
        handleDeleteItem,
        handleMoveItem,
        handleDropItem,
        toggleFavorite,
        toggleBankItem,
        closeBankModal,
        handleToggleItemWithReuse,
    } = useItemSelection({ onFinalize });

    return (
        <div className="w-full h-full font-[var(--font-body)]">

            {!generated && !generating && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-6 h-full flex flex-col justify-center animate-fade-in-up"
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] border border-[var(--primary)]/30">
                        <Sparkles size={48} className="text-[var(--primary)] animate-pulse fill-current" />
                    </div>

                    <h2 className="text-3xl font-bold text-[var(--on-background)] mb-2">¡Todo listo para armar tu Evaluación!</h2>
                    <p className="text-[var(--muted)] mb-10">Revisa la tabla de especificaciones antes de que el motor pedagógico comience a procesar.</p>

                    <div className="max-w-4xl mx-auto bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-8 mb-10 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 relative z-10 w-full">
                            <div>
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Asignatura</span>
                                <div className="flex items-center gap-2 text-[var(--foreground)] font-medium text-lg">
                                    {testData.subject}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Curso</span>
                                <div className="text-[var(--foreground)] font-medium text-lg">{testData.grade}</div>
                            </div>

                            <div className="col-span-2 pt-4 border-t border-[var(--border)]/50 mt-2">
                                <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-4">Tabla de Especificaciones Resumida ({totalQuestions} preguntas)</span>
                                <div className="space-y-2 relative z-10 w-full overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                        {blueprint.map(row => (
                                            <div key={row.id} className="text-sm p-3 rounded-xl bg-[var(--card)]/50 border border-[var(--border)] w-full">
                                                <div className="flex justify-between items-center mb-1 w-full">
                                                    <span className="text-[var(--on-background)] font-medium text-xs line-clamp-1" title={row.topic}>{row.topic}</span>
                                                    <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded border border-[var(--primary)]/20 whitespace-nowrap ml-2">
                                                        {row.count} ítems
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-[var(--muted)] uppercase bg-[var(--input-bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">{row.itemType}</span>
                                                    <span className="text-[10px] text-[var(--muted)] truncate max-w-[150px] ml-2">OA: {row.oa}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center items-center w-full">
                        <Button
                            onClick={handleGenerate}
                            className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:brightness-110 !px-12 !py-4 rounded-xl text-lg font-bold shadow-[0_0_30px_rgba(139,92,246,0.5)] border-none transform hover:scale-105 transition-all w-full max-w-sm flex items-center justify-center gap-3"
                        >
                            <Wand2 className="fill-white" size={24} /> Generar Preguntas
                        </Button>
                    </div>
                </motion.div>
            )}

            {generating && (
                <div className="py-12 max-w-2xl mx-auto h-full flex flex-col justify-center animate-fade-in">
                    {/* Main Icon with Animation */}
                    <div className="relative w-28 h-28 mx-auto mb-8 mt-12">
                        <div className="absolute inset-0 bg-[var(--primary)]/30 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 bg-[var(--secondary)]/20 rounded-full animate-pulse"></div>
                        <div className="relative z-10 w-full h-full bg-[var(--card)] rounded-full flex items-center justify-center border-2 border-[var(--primary)] shadow-[0_0_50px_rgba(139,92,246,0.5)]">
                            <span className="text-4xl">{LOADING_MESSAGES[loadingStage]?.icon || '✨'}</span>
                        </div>
                    </div>

                    {/* Current Stage Message */}
                    <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2 text-center h-[3rem]">
                        {LOADING_MESSAGES[loadingStage]?.text || 'Generando evaluación...'}
                    </h3>

                    {/* Timer Display */}
                    <div className="flex items-center justify-center gap-2 text-[var(--muted)] mb-6">
                        <Clock size={16} />
                        <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                        <span className="text-sm opacity-70"> / est. 4 min</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mb-8 px-4">
                        <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden w-full">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(loadingProgress, 100)}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-[var(--muted)]">
                            <span>Fase {Math.min(loadingStage + 1, LOADING_MESSAGES.length)} de {LOADING_MESSAGES.length}</span>
                            <span className="font-bold text-[var(--primary)]">{Math.min(Math.round(loadingProgress), 100)}%</span>
                        </div>
                    </div>

                    {/* Educational Tip */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTip}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-[var(--primary-bg)]/30 border border-[var(--primary)]/20 rounded-xl p-5 text-center mt-6 shadow-inner mx-4"
                        >
                            <p className="text-sm text-[var(--primary)] font-medium">💡 Sabías que...</p>
                            <p className="text-sm text-[var(--muted)] italic mt-2">
                                {EDUCATIONAL_TIPS[currentTip]}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Reassurance Message */}
                    <p className="text-[var(--muted)] text-sm mt-8 text-center opacity-75">
                        El motor de Inteligencia Artificial está construyendo tu instrumento docente.<br />Por favor, no cierres esta pestaña.
                    </p>
                </div>
            )}

            {generated && !generating && (
                <div className="flex flex-col md:flex-row h-full gap-6 items-start animate-fade-in-up font-[var(--font-body)]">
                    {/* Left: Summary (compacto, acciones arriba) */}
                    <div className="w-full md:w-72 space-y-3 md:sticky md:top-0 flex-shrink-0">
                        {/* Acciones principales: primero visibles */}
                        <div className="space-y-2">
                            <button
                                onClick={handleFinalizeAction}
                                disabled={currentCount === 0}
                                className="w-full btn-gradient py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-40 disabled:grayscale"
                            >
                                <Mail size={18} className="group-hover:animate-bounce" /> Finalizar y Publicar
                            </button>
                            <button
                                onClick={handlePrintEvaluation}
                                disabled={currentCount === 0}
                                className="w-full bg-[var(--card)] border border-[var(--border)] text-[var(--on-background)] py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 hover:bg-[var(--card-hover)] hover:border-[var(--primary)] disabled:opacity-40 disabled:grayscale text-sm"
                            >
                                <Printer size={16} /> Imprimir Prueba y Pauta
                            </button>
                        </div>

                        {/* Progreso compacto */}
                        <div className="glass-card-premium p-4 rounded-xl border border-[var(--border)]">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Progreso</span>
                                <span className={`text-lg font-black ${progress >= 100 ? 'text-green-400' : 'text-[var(--on-background)]'}`}>
                                    {currentCount}<span className="text-sm text-[var(--muted)] font-bold">/{totalQuestions}</span>
                                </span>
                            </div>
                            <div className="w-full bg-[var(--input-bg)] h-1.5 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]'}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                            </div>

                            {/* Distribución blueprint — lista densa */}
                            <div className="space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar">
                                {blueprint.map(row => {
                                    const countSelected = items.filter((item: GeneratedItem) =>
                                        selectedItems.includes(item.id) &&
                                        ((item as any).blueprintRowId === row.id || ((item.type || item.itemType) === row.itemType && item.oa === row.oa))
                                    ).length;
                                    const complete = countSelected >= row.count;
                                    return (
                                        <div key={row.id} className="flex items-center gap-2 py-1 text-[11px]">
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${complete ? 'bg-green-400' : 'bg-[var(--muted)]/40'}`}></span>
                                            <span className="text-[var(--muted)] truncate flex-1" title={row.topic}>{row.topic}</span>
                                            <span className={`font-bold tabular-nums ${complete ? 'text-green-400' : 'text-[var(--muted)]'}`}>
                                                {countSelected}/{row.count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: Items List */}
                    <div className="flex-1 flex flex-col min-h-[600px] w-full mt-0">
                        {/* EV-14: Shared stimulus text */}
                        <div className="mb-3">
                            <button
                                onClick={() => setShowStimulusInput(!showStimulusInput)}
                                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                            >
                                <FileText size={14} />
                                {showStimulusInput ? 'Ocultar texto compartido' : 'Agregar texto compartido (estímulo)'}
                            </button>
                            {showStimulusInput && (
                                <div className="mt-2 p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl">
                                    <label className="text-xs text-[var(--muted)] mb-1 block">Texto estímulo que precede a un grupo de preguntas:</label>
                                    <textarea
                                        value={stimulusText}
                                        onChange={(e) => setStimulusText(e.target.value)}
                                        placeholder="Ej: Lee el siguiente texto y responde las preguntas 1 a 5..."
                                        rows={4}
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm resize-y"
                                    />
                                    {stimulusText && (
                                        <p className="text-[10px] text-emerald-400 mt-1">Este texto se imprimirá antes de los ítems seleccionados.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-[var(--card)]/60 border-b border-[var(--border)] flex justify-between items-center rounded-t-2xl backdrop-blur-md sticky top-0 z-20 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <h3 className="font-bold text-[var(--on-background)] flex items-center gap-2 font-[var(--font-heading)] text-sm whitespace-nowrap">
                                    <Sparkles size={16} className="text-[var(--primary)] fill-current" />
                                    {items.length} ítems
                                </h3>
                                <select
                                    value={skillFilter}
                                    onChange={(e) => setSkillFilter(e.target.value)}
                                    className="text-xs rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1.5 max-w-[180px]"
                                    title="Filtrar por habilidad"
                                >
                                    <option value="all">Todas las habilidades</option>
                                    {skillOptions.filter((skill) => skill !== 'all').map((skill) => (
                                        <option key={skill} value={skill}>{skill}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative" ref={actionsRef}>
                                <button
                                    onClick={() => setActionsOpen((v) => !v)}
                                    className="text-xs font-bold text-[var(--on-background)] flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--card)]"
                                >
                                    Acciones <ChevronDown size={14} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {actionsOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-30 overflow-hidden">
                                        {filteredItems.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const allFilteredIds = filteredItems.map(({ item }) => item.id);
                                                    const allSelected = allFilteredIds.every((id) => selectedItems.includes(id));
                                                    if (allSelected) {
                                                        setSelectedItems(selectedItems.filter((id) => !allFilteredIds.includes(id)));
                                                    } else {
                                                        setSelectedItems(Array.from(new Set([...selectedItems, ...allFilteredIds])));
                                                    }
                                                    setActionsOpen(false);
                                                }}
                                                className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)]"
                                            >
                                                <Check size={14} className="text-[var(--primary)]" />
                                                {filteredItems.every(({ item }) => selectedItems.includes(item.id)) ? 'Deseleccionar todas' : 'Seleccionar todas'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { handleImportFromBank(); setActionsOpen(false); }}
                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)]"
                                        >
                                            <Download size={14} className="text-[var(--primary)]" /> Importar desde banco
                                        </button>
                                        <button
                                            onClick={() => { handleGenerate(); setActionsOpen(false); }}
                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)] border-t border-[var(--border)]"
                                        >
                                            <RefreshCw size={14} className="text-[var(--primary)]" /> Regenerar todo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-4 pt-4">
                            <div className="glass-card-premium rounded-xl border border-[var(--border)] p-3">
                                <p className="text-xs font-semibold text-[var(--on-background)] mb-2">Distribución por habilidad cognitiva</p>
                                <div className="space-y-2">
                                    {Object.entries(itemsBySkill).length === 0 && (
                                        <p className="text-xs text-[var(--muted)]">Sin ítems generados.</p>
                                    )}
                                    {Object.entries(itemsBySkill).map(([skill, count]) => {
                                        const percent = Math.round((count / (items.length || 1)) * 100);
                                        return (
                                            <div key={skill}>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-[var(--muted)]">{skill}</span>
                                                    <span className="text-[var(--on-background)] font-semibold">{count} ({percent}%)</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                                        style={{ width: `${percent}% ` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
                            {filteredItems.map(({ item, index }) => {
                                const isSelected = selectedItems.includes(item.id);
                                const isEditing = editingItemId === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={() => setDraggingIndex(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDropItem(index)}
                                        onDragEnd={() => setDraggingIndex(null)}
                                        className={`glass - card - premium p - 6 rounded - 2xl border transition - all duration - 300 relative group
                                        ${isSelected
                                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]'
                                                : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--card-hover)]'
                                            }
                                        ${draggingIndex === index ? 'opacity-60' : ''}
        `}
                                    >
                                        <div className="absolute top-4 right-4 flex gap-2 z-10 items-center">
                                            <button
                                                onClick={() => setEditingItemId(isEditing ? null : item.id)}
                                                className="p-2 rounded-lg transition-all bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)]"
                                                title={isEditing ? 'Cancelar edición' : 'Editar ítem'}
                                            >
                                                {isEditing ? <X size={16} /> : <Pencil size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleToggleItemWithReuse(item.id, item.question)}
                                                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${isSelected
                                                    ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-md shadow-indigo-500/30'
                                                    : 'bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)]'
                                                    }`}
                                                title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                                            >
                                                {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                                                <span className="hidden sm:inline">{isSelected ? 'Seleccionada' : 'Seleccionar'}</span>
                                            </button>
                                            <div className="relative" ref={openKebabId === item.id ? kebabRef : null}>
                                                <button
                                                    onClick={() => setOpenKebabId(openKebabId === item.id ? null : item.id)}
                                                    className="p-2 rounded-lg transition-all bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--on-background)] border border-[var(--border)] hover:border-[var(--primary)]"
                                                    title="Más acciones"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {openKebabId === item.id && (
                                                    <div className="absolute right-0 top-full mt-1 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-30 overflow-hidden">
                                                        <button
                                                            onClick={() => { handleMoveItem(index, 'up'); setOpenKebabId(null); }}
                                                            disabled={index === 0}
                                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)] disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <ArrowUp size={14} /> Mover arriba
                                                        </button>
                                                        <button
                                                            onClick={() => { handleMoveItem(index, 'down'); setOpenKebabId(null); }}
                                                            disabled={index === items.length - 1}
                                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)] disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <ArrowDown size={14} /> Mover abajo
                                                        </button>
                                                        <button
                                                            onClick={() => { handleSaveToBank(item); setOpenKebabId(null); }}
                                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--card-hover)] flex items-center gap-2 text-[var(--on-background)] border-t border-[var(--border)]"
                                                        >
                                                            <Save size={14} className="text-amber-500" /> Guardar en banco
                                                        </button>
                                                        <button
                                                            onClick={() => { handleDeleteItem(item.id); setOpenKebabId(null); }}
                                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 border-t border-[var(--border)]"
                                                        >
                                                            <Trash2 size={14} /> Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Padding-right reservado para botones visibles (editar + seleccionar + kebab ≈ 220px). */}
                                        <div className="flex flex-wrap gap-2 mb-4 pr-0 sm:pr-[220px]">
                                            <span className="bg-[var(--primary)]/5 text-[var(--primary)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--primary)]/10 tracking-wider">{item.type || item.itemType || 'Item'}</span>
                                            <span className="bg-[var(--input-bg)] text-[var(--muted)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--border)]">{item.oa || 'OA'}</span>
                                            <span className="bg-[var(--input-bg)] text-[var(--muted)] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-[var(--border)]">{item.difficulty || 'General'}</span>
                                            {/* EV-09: Editable cognitive skill badge */}
                                            <span className="relative">
                                                {editingSkillId === item.id ? (
                                                    <select
                                                        value={item.skill || ''}
                                                        onChange={(e) => {
                                                            handleItemFieldChange(item.id, 'skill', e.target.value);
                                                            setEditingSkillId(null);
                                                        }}
                                                        onBlur={() => setEditingSkillId(null)}
                                                        autoFocus
                                                        className="bg-[var(--input-bg)] text-[var(--muted)] px-2 py-1 rounded-md text-[10px] font-bold border border-[var(--primary)] focus:outline-none"
                                                    >
                                                        {COGNITIVE_SKILLS.map(sk => (
                                                            <option key={sk} value={sk}>{sk}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingSkillId(item.id)}
                                                        className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border border-amber-500/20 tracking-wider cursor-pointer hover:border-amber-500/50 transition-colors"
                                                        title="Clic para cambiar habilidad cognitiva"
                                                    >
                                                        {item.skill || 'Habilidad'}
                                                    </button>
                                                )}
                                            </span>
                                        </div>

                                        {!isEditing && (
                                            <>
                                                {item.stimulusText && (
                                                    <div className="mb-4 p-4 bg-[var(--input-bg)] border-l-4 border-[var(--primary)] rounded-r-xl">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] mb-2 block">
                                                            {item.stimulusType === 'source' ? '📜 Fuente' : item.stimulusType === 'table' ? '📊 Datos' : '📖 Lee el siguiente texto'}
                                                        </span>
                                                        <p className="text-sm text-[var(--on-background)] leading-relaxed whitespace-pre-wrap font-[var(--font-body)]">
                                                            {item.stimulusText}
                                                        </p>
                                                    </div>
                                                )}
                                                {item.imageUrl && (
                                                    <div className="mb-4 max-w-md">
                                                        <img src={item.imageUrl} alt="Imagen del enunciado" className="rounded-xl border border-[var(--border)] shadow-md max-h-48 object-contain" />
                                                    </div>
                                                )}
                                                <p className="text-[var(--on-background)] font-medium mb-3 pr-32 text-lg leading-relaxed font-[var(--font-body)]">
                                                    <LatexInlineRenderer text={item.question || ''} />
                                                </p>
                                            </>
                                        )}

                                        {isEditing && (
                                            <div className="space-y-3 mb-6 pr-2">
                                                {/* Stimulus Text */}
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1 block">
                                                        📖 Texto estímulo (opcional)
                                                    </label>
                                                    <textarea
                                                        value={item.stimulusText || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'stimulusText', e.target.value || null)}
                                                        placeholder="Ej: Lee el siguiente fragmento: &quot;En 1879, Chile enfrentó...&quot;"
                                                        rows={3}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm resize-y"
                                                    />
                                                    {item.stimulusText && (
                                                        <select
                                                            value={item.stimulusType || 'text'}
                                                            onChange={(e) => handleItemFieldChange(item.id, 'stimulusType', e.target.value)}
                                                            className="mt-1 text-xs rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1"
                                                        >
                                                            <option value="text">📖 Texto</option>
                                                            <option value="source">📜 Fuente</option>
                                                            <option value="table">📊 Tabla/Datos</option>
                                                        </select>
                                                    )}
                                                </div>
                                                {/* Question */}
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1 block">
                                                        Enunciado
                                                    </label>
                                                    <textarea
                                                        value={item.question || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'question', e.target.value)}
                                                        className="w-full min-h-[90px] rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                {/* Image Upload */}
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer transition-colors">
                                                        <ImagePlus size={16} />
                                                        {item.imageUrl ? 'Cambiar imagen' : 'Agregar imagen'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(item.id, file);
                                                            }}
                                                        />
                                                    </label>
                                                    {item.imageUrl && (
                                                        <>
                                                            <img src={item.imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-[var(--border)]" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleItemFieldChange(item.id, 'imageUrl', null)}
                                                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input
                                                        value={item.oa || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'oa', e.target.value)}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                        placeholder="OA"
                                                    />
                                                    <input
                                                        value={item.skill || ''}
                                                        onChange={(e) => handleItemFieldChange(item.id, 'skill', e.target.value)}
                                                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                        placeholder="Habilidad cognitiva"
                                                    />
                                                </div>
                                                <input
                                                    value={item.correctAnswer || ''}
                                                    onChange={(e) => handleItemFieldChange(item.id, 'correctAnswer', e.target.value)}
                                                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
                                                    placeholder="Respuesta correcta"
                                                />
                                            </div>
                                        )}

                                        {/* Render options if available (Selection) — EV-15: Doble Proceso uses vertical layout */}
                                        {item.options && Array.isArray(item.options) && (
                                            <div className={`gap-3 max-w-2xl ${(item.type || item.itemType) === 'Doble Proceso' ? 'flex flex-col' : 'grid grid-cols-1 md:grid-cols-2'}`}>
                                                {item.options.map((opt: string, i: number) => (
                                                    <div key={i} className="p-3 rounded-xl border text-sm flex gap-3 items-center transition-colors bg-[var(--input-bg)] border-[var(--border)] hover:bg-[var(--card)]">
                                                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--border)] text-[var(--muted)]">
                                                            {String.fromCharCode(65 + i)}
                                                        </span>
                                                        {!isEditing && (
                                                            <span className="text-[var(--muted)]">
                                                                <LatexInlineRenderer text={opt || ''} />
                                                            </span>
                                                        )}
                                                        {isEditing && (
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => handleItemOptionChange(item.id, i, e.target.value)}
                                                                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Render answer key if not selection or for debug */}
                                        {!item.options && item.correctAnswer && (
                                            <div className="p-4 bg-[var(--input-bg)] rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] italic mt-4">
                                                Respuesta esperada: <LatexInlineRenderer text={item.correctAnswer || ''} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showBankModal}
                onClose={closeBankModal}
                title="Importar desde Banco de Ítems"
            >
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                        <input
                            value={bankQuery}
                            onChange={(e) => setBankQuery(e.target.value)}
                            placeholder="Buscar por OA, pregunta, asignatura o habilidad..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-sm"
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 p-1 bg-[var(--input-bg)] rounded-lg border border-[var(--border)]">
                        {([['all', 'Todos'], ['own', 'Míos'], ['shared', 'Compartidos'], ['favorites', '❤️ Favoritos']] as const).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setBankTabFilter(key as any)}
                                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${bankTabFilter === key ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="max-h-[50vh] overflow-auto border border-[var(--border)] rounded-xl">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)]">
                                <tr>
                                    <th className="py-2 px-3 text-left">Sel.</th>
                                    <th className="py-2 px-3 text-left">⭐</th>
                                    <th className="py-2 px-3 text-left">OA</th>
                                    <th className="py-2 px-3 text-left">Pregunta</th>
                                    <th className="py-2 px-3 text-left">Tipo</th>
                                    <th className="py-2 px-3 text-left">Habilidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bankLoading && (
                                    <tr>
                                        <td colSpan={6} className="py-4 px-3 text-center text-[var(--muted)]">Cargando ítems...</td>
                                    </tr>
                                )}
                                {!bankLoading && filteredBankItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-4 px-3 text-center text-[var(--muted)]">No hay ítems para importar.</td>
                                    </tr>
                                )}
                                {!bankLoading && filteredBankItems.map((item) => (
                                    <tr key={item.id} className="border-b border-[var(--border)]">
                                        <td className="py-2 px-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedBankItemIds.includes(item.id)}
                                                onChange={() => toggleBankItem(item.id)}
                                                className="accent-[var(--primary)]"
                                            />
                                        </td>
                                        <td className="py-2 px-3">
                                            <button
                                                onClick={() => toggleFavorite(item.id)}
                                                disabled={togglingFav === item.id}
                                                className="p-1 rounded transition-colors"
                                            >
                                                <Heart size={14} className={item.is_favorite ? 'fill-red-400 text-red-400' : 'text-[var(--muted)] hover:text-red-400'} />
                                            </button>
                                        </td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.oa || '—'}</td>
                                        <td className="py-2 px-3 max-w-[420px]">{item.question_text}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.question_type || '—'}</td>
                                        <td className="py-2 px-3 whitespace-nowrap">{item.cognitive_skill || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={closeBankModal}
                            className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--on-background)]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmBankImport}
                            className="px-4 py-2 rounded-lg btn-gradient font-semibold"
                        >
                            Importar Seleccionados ({selectedBankItemIds.length})
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
