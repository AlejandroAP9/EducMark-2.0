'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { RUBRICA_INDICADORES } from '../data/rubricaIndicadores';
import GuidedQuestions from './GuidedQuestions';
import type { GuidedAnswers } from '../types/portfolio';

type TabKey = 'T1' | 'T2' | 'T3';

interface TabConfig {
  key: TabKey;
  label: string;
  draftField: 'draftT1' | 'draftT2' | 'draftT3';
  sections: { id: keyof GuidedAnswers; label: string }[];
}

const TABS: TabConfig[] = [
  {
    key: 'T1',
    label: 'T1 Planificacion',
    draftField: 'draftT1',
    sections: [{ id: 't1_diversidad', label: 'Diversidad y pertinencia' }],
  },
  {
    key: 'T2',
    label: 'T2 Evaluacion',
    draftField: 'draftT2',
    sections: [
      { id: 't2_analisis_causas', label: 'Analisis de causas' },
      { id: 't2_uso_formativo', label: 'Uso formativo' },
    ],
  },
  {
    key: 'T3',
    label: 'T3 Reflexion',
    draftField: 'draftT3',
    sections: [{ id: 't3_socioemocional', label: 'Reflexion socioemocional' }],
  },
];

function RubricHints({ tarea }: { tarea: TabKey }) {
  const indicators = RUBRICA_INDICADORES.filter((r) => r.tarea === tarea);
  if (indicators.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
        Indicadores de la rubrica
      </p>
      {indicators.map((ind) => (
        <div
          key={ind.id}
          className="bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2"
        >
          <p className="text-xs font-medium text-[var(--secondary)]">{ind.name}</p>
          <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
            {ind.nivel_competente}
          </p>
        </div>
      ))}
    </div>
  );
}

function buildCombinedText(
  autoText: string,
  guidedAnswers: GuidedAnswers,
  sections: { id: keyof GuidedAnswers; label: string }[]
): string {
  let combined = autoText;

  for (const section of sections) {
    const answers = guidedAnswers[section.id];
    if (!answers || Object.keys(answers).length === 0) continue;

    combined += `\n\n--- ${section.label.toUpperCase()} ---`;
    for (const [key, value] of Object.entries(answers)) {
      if (value.trim()) {
        combined += `\n\n${key}: ${value}`;
      }
    }
  }

  return combined;
}

export default function TaskDraftEditor() {
  const [activeTab, setActiveTab] = useState<TabKey>('T1');
  const store = usePortfolioStore();

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const draftText = store[currentTab.draftField];

  const handleCopy = useCallback(async () => {
    const combined = buildCombinedText(
      draftText,
      store.guidedAnswers,
      currentTab.sections
    );

    try {
      await navigator.clipboard.writeText(combined);
      toast.success(`Borrador ${activeTab} copiado`);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  }, [draftText, store.guidedAnswers, currentTab, activeTab]);

  const handleGuidedAnswer = useCallback(
    (sectionId: keyof GuidedAnswers, key: string, value: string) => {
      store.setGuidedAnswer(sectionId, key, value);
    },
    [store]
  );

  const handleDraftEdit = useCallback(
    (value: string) => {
      if (currentTab.draftField === 'draftT1') store.setDraftT1(value);
      else if (currentTab.draftField === 'draftT2') store.setDraftT2(value);
      else store.setDraftT3(value);
    },
    [currentTab.draftField, store]
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--card-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Rubric hints */}
          <RubricHints tarea={activeTab} />

          {/* Auto-generated text (read-only view) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                Texto auto-generado desde tus datos
              </p>
              <span className="text-[10px] text-[var(--muted)] opacity-70 bg-[var(--input-bg)] border border-[var(--card-border)] px-2 py-0.5 rounded">
                solo lectura
              </span>
            </div>
            <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-4 max-h-60 overflow-y-auto">
              <pre className="text-sm text-[var(--muted)] whitespace-pre-wrap font-sans leading-relaxed">
                {draftText || '(Sin datos generados)'}
              </pre>
            </div>
          </div>

          {/* Guided questions */}
          {currentTab.sections.map((section) => (
            <div
              key={section.id}
              className="bg-[var(--input-bg)] border border-[var(--border)] rounded-xl p-5"
            >
              <GuidedQuestions
                sectionId={section.id}
                answers={store.guidedAnswers[section.id] ?? {}}
                onAnswer={(key, value) =>
                  handleGuidedAnswer(section.id, key, value)
                }
              />
            </div>
          ))}

          {/* Editable final draft preview */}
          <div>
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide mb-2">
              Vista previa del borrador final (editable)
            </p>
            <textarea
              value={draftText}
              onChange={(e) => handleDraftEdit(e.target.value)}
              rows={10}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-y font-mono leading-relaxed"
            />
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copiar borrador {activeTab} al portapapeles
          </button>

          {store.saving && (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <div className="w-3 h-3 border border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              Guardando...
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
