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
      <div className="text-sm text-white/40 py-4">
        Seccion &quot;{sectionId}&quot; no encontrada en las preguntas guia.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-[#F8F9FA]">
          {section.tarea}
        </h4>
        <p className="text-xs text-white/50 mt-1">{section.indicador}</p>
        <div className="mt-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg px-3 py-2">
          <p className="text-xs text-[#8B5CF6]">
            <span className="font-medium">Nivel Competente:</span>{' '}
            {section.nivel_competente}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {section.preguntas.map((pregunta) => (
          <div
            key={pregunta.key}
            className="border-l-2 border-[#8B5CF6] pl-4"
          >
            <label className="block text-sm text-[#F8F9FA] mb-2 leading-relaxed">
              {pregunta.pregunta}
            </label>
            <textarea
              value={answers[pregunta.key] ?? ''}
              onChange={(e) => onAnswer(pregunta.key, e.target.value)}
              placeholder={pregunta.placeholder}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F8F9FA] placeholder:text-white/20 focus:outline-none focus:border-[#8B5CF6] transition-colors resize-y"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
