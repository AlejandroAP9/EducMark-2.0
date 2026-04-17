import { create } from 'zustand';
import type { GuidedAnswers, PortfolioScoring } from '../types/portfolio';

interface PortfolioStoreState {
  draftId: string | null;
  draftT1: string;
  draftT2: string;
  draftT3: string;
  guidedAnswers: GuidedAnswers;
  saving: boolean;
  wizardCompleted: boolean;
  scoring: PortfolioScoring;

  setDraft: (t1: string, t2: string, t3: string) => void;
  setDraftT1: (t1: string) => void;
  setDraftT2: (t2: string) => void;
  setDraftT3: (t3: string) => void;
  setDraftId: (id: string) => void;
  setGuidedAnswer: (
    section: keyof GuidedAnswers,
    key: string,
    value: string
  ) => void;
  setSaving: (saving: boolean) => void;
  setWizardCompleted: (completed: boolean) => void;
  setScoring: (scoring: PortfolioScoring) => void;
  reset: () => void;
}

const initialState = {
  draftId: null,
  draftT1: '',
  draftT2: '',
  draftT3: '',
  guidedAnswers: {} as GuidedAnswers,
  saving: false,
  wizardCompleted: false,
  scoring: {} as PortfolioScoring,
};

export const usePortfolioStore = create<PortfolioStoreState>((set) => ({
  ...initialState,

  setDraft: (t1, t2, t3) => set({ draftT1: t1, draftT2: t2, draftT3: t3 }),

  setDraftT1: (t1) => set({ draftT1: t1 }),
  setDraftT2: (t2) => set({ draftT2: t2 }),
  setDraftT3: (t3) => set({ draftT3: t3 }),

  setDraftId: (id) => set({ draftId: id }),

  setGuidedAnswer: (section, key, value) =>
    set((state) => ({
      guidedAnswers: {
        ...state.guidedAnswers,
        [section]: {
          ...(state.guidedAnswers[section] ?? {}),
          [key]: value,
        },
      },
    })),

  setSaving: (saving) => set({ saving }),

  setWizardCompleted: (completed) => set({ wizardCompleted: completed }),

  setScoring: (scoring) => set({ scoring }),

  reset: () => set(initialState),
}));
