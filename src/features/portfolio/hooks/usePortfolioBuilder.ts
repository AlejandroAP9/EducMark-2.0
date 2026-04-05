'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchClassesByPeriod,
  fetchEvaluations,
  fetchEvaluationItems,
  fetchOMRResults,
  fetchUserSubjectsCourses,
} from '../services/portfolioService';
import type {
  GeneratedClassRow,
  EvaluationRow,
  EvaluationItemRow,
  OMRResultRow,
  PortfolioWizardState,
} from '../types/portfolio';

interface PortfolioBuilderData {
  classes: GeneratedClassRow[];
  evaluations: EvaluationRow[];
  evaluationItems: EvaluationItemRow[];
  omrResults: OMRResultRow[];
  hasOMR: boolean;
  loading: boolean;
  error: string | null;
  userId: string | null;
  availableAsignaturas: string[];
  availableCursos: string[];
}

export function usePortfolioBuilder() {
  const supabase = createClient();

  const [wizardState, setWizardState] = useState<PortfolioWizardState>({
    step: 1,
    asignatura: '',
    curso: '',
    periodo: '',
    selectedClasses: [],
    selectedEvaluation: null,
    hasOMR: false,
  });

  const [data, setData] = useState<PortfolioBuilderData>({
    classes: [],
    evaluations: [],
    evaluationItems: [],
    omrResults: [],
    hasOMR: false,
    loading: false,
    error: null,
    userId: null,
    availableAsignaturas: [],
    availableCursos: [],
  });

  // Obtener userId + opciones disponibles al montar
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        setData((prev) => ({ ...prev, userId }));
        try {
          const { asignaturas, cursos } = await fetchUserSubjectsCourses(userId);
          setData((prev) => ({
            ...prev,
            availableAsignaturas: asignaturas,
            availableCursos: cursos,
          }));
        } catch {
          // No bloquear si falla — el usuario verá dropdowns vacíos
        }
      }
    };
    getUser();
  }, [supabase.auth]);

  // Cargar clases y evaluaciones cuando se selecciona asignatura + curso
  const loadData = useCallback(
    async (asignatura: string, curso: string) => {
      if (!data.userId || !asignatura || !curso) return;

      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [classes, evaluations] = await Promise.all([
          fetchClassesByPeriod(data.userId, asignatura, curso),
          fetchEvaluations(data.userId, asignatura, curso),
        ]);

        setData((prev) => ({
          ...prev,
          classes,
          evaluations,
          loading: false,
        }));
      } catch (err) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Error cargando datos',
        }));
      }
    },
    [data.userId]
  );

  // Cargar items y OMR cuando se selecciona evaluación
  const loadEvaluationData = useCallback(async (evaluationId: string) => {
    setData((prev) => ({ ...prev, loading: true }));

    try {
      const [items, omr] = await Promise.all([
        fetchEvaluationItems(evaluationId),
        fetchOMRResults(evaluationId),
      ]);

      const hasOMR = omr.length > 0;

      setData((prev) => ({
        ...prev,
        evaluationItems: items,
        omrResults: omr,
        hasOMR,
        loading: false,
      }));

      setWizardState((prev) => ({ ...prev, hasOMR }));
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error cargando evaluación',
      }));
    }
  }, []);

  // Avanzar paso del wizard
  const nextStep = useCallback(() => {
    setWizardState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 3) }));
  }, []);

  const prevStep = useCallback(() => {
    setWizardState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  // Setters del wizard
  const setAsignaturaCurso = useCallback(
    (asignatura: string, curso: string, periodo: string) => {
      setWizardState((prev) => ({ ...prev, asignatura, curso, periodo }));
      loadData(asignatura, curso);
    },
    [loadData]
  );

  const setSelectedClasses = useCallback((ids: string[]) => {
    setWizardState((prev) => ({ ...prev, selectedClasses: ids.slice(0, 3) }));
  }, []);

  const setSelectedEvaluation = useCallback(
    (id: string | null) => {
      setWizardState((prev) => ({ ...prev, selectedEvaluation: id }));
      if (id) loadEvaluationData(id);
    },
    [loadEvaluationData]
  );

  // Obtener las clases seleccionadas (objetos completos)
  const getSelectedClassObjects = useCallback(() => {
    return data.classes.filter((c) =>
      wizardState.selectedClasses.includes(c.id)
    );
  }, [data.classes, wizardState.selectedClasses]);

  // Obtener la evaluación seleccionada
  const getSelectedEvaluationObject = useCallback(() => {
    return data.evaluations.find(
      (e) => e.id === wizardState.selectedEvaluation
    ) ?? null;
  }, [data.evaluations, wizardState.selectedEvaluation]);

  return {
    wizardState,
    data,
    nextStep,
    prevStep,
    setAsignaturaCurso,
    setSelectedClasses,
    setSelectedEvaluation,
    getSelectedClassObjects,
    getSelectedEvaluationObject,
  };
}
