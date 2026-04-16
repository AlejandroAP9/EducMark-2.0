'use client';

import React from 'react';
import { TEMPLATE_PREGUNTAS } from '../data/templatePreguntas';

interface GuidedQuestionsProps {
  sectionId: string;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
}

export default function GuidedQuestions({
  sectionId,
  answers,
  onAnswer,
}: GuidedQuestionsProps) {
  const section = TEMPLATE_PREGUNTAS.find((s) => s.id === sectionId);

  if (!section) {
    return (
      <div className="text-sm text-[var(--muted)] py-4">
        Seccion &quot;{sectionId}&quot; no encontrada en las preguntas guia.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)]">
          {section.tarea}
        </h4>
        <p className="text-xs text-[var(--muted)] mt-1">{section.indicador}</p>
        <div className="mt-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg px-3 py-2">
          <p className="text-xs text-[var(--primary)]">
            <span className="font-medium">Nivel Competente:</span>{' '}
            {section.nivel_competente}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {section.preguntas.map((pregunta) => (
          <div
            key={pregunta.key}
            className="border-l-2 border-[var(--primary)] pl-4"
          >
            <label className="block text-sm text-[var(--foreground)] mb-2 leading-relaxed">
              {pregunta.pregunta}
            </label>
            <textarea
              value={answers[pregunta.key] ?? ''}
              onChange={(e) => onAnswer(pregunta.key, e.target.value)}
              placeholder={pregunta.placeholder}
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
