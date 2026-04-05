'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { updateDraft, saveDraft } from '../services/portfolioService';
import { createClient } from '@/lib/supabase/client';
import PortfolioWizard from './PortfolioWizard';
import TaskDraftEditor from './TaskDraftEditor';

export default function PortfolioPreview() {
  const store = usePortfolioStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Auto-save debounced
  const triggerAutoSave = useCallback(async () => {
    const { draftId, draftT1, draftT2, draftT3, guidedAnswers } =
      usePortfolioStore.getState();

    store.setSaving(true);

    try {
      if (draftId) {
        await updateDraft(draftId, {
          draft_t1: draftT1,
          draft_t2: draftT2,
          draft_t3: draftT3,
          guided_answers: guidedAnswers,
        });
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;

        const saved = await saveDraft({
          user_id: session.user.id,
          title: 'Portafolio Modulo 1',
          asignatura: '',
          curso: '',
          periodo: null,
          status: 'borrador',
          selected_classes: [],
          selected_evaluation: null,
          draft_t1: draftT1,
          draft_t2: draftT2,
          draft_t3: draftT3,
          guided_answers: guidedAnswers,
        });
        store.setDraftId(saved.id);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      toast.error('Error al guardar borrador');
    } finally {
      store.setSaving(false);
    }
  }, [store, supabase.auth]);

  // Watch store changes for auto-save
  useEffect(() => {
    if (!store.wizardCompleted) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      triggerAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [
    store.draftT1,
    store.draftT2,
    store.draftT3,
    store.guidedAnswers,
    store.wizardCompleted,
    triggerAutoSave,
  ]);

  const handleBackToWizard = useCallback(() => {
    store.setWizardCompleted(false);
  }, [store]);

  return (
    <div className="min-h-screen bg-[#05050A] text-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            {store.wizardCompleted && (
              <button
                onClick={handleBackToWizard}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                aria-label="Volver al wizard"
              >
                <svg
                  className="w-4 h-4 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[#F8F9FA]">
                Portafolio Carrera Docente{' '}
                <span className="text-[#8B5CF6]">— Modulo 1</span>
              </h1>
              <p className="text-sm text-white/50 mt-0.5">
                Genera borradores de texto para completar en docentemas.cl
              </p>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="mb-8 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-[#F59E0B]/80 leading-relaxed">
            Borrador generado con datos de EducMark — revisa y ajusta antes de
            enviarlo en docentemas.cl
          </p>
        </div>

        {/* Main content */}
        {store.wizardCompleted ? <TaskDraftEditor /> : <PortfolioWizard />}
      </div>
    </div>
  );
}
