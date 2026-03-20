import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BlueprintRow {
    id: number;
    oa: string;
    topic: string;
    skill: string;
    itemType: string;
    count: number;
}

export interface TestData {
    testTitle: string;
    grade: string;
    subject: string;
    unit: string;
    items: unknown[];
}

interface TestDesignerState {
    step: number;
    testData: TestData;
    blueprint: BlueprintRow[];
    selectedItems: number[];
    generatedItems: unknown[]; // The AI generated items
    testId: string | null;

    setStep: (step: number) => void;
    setTestData: (data: Partial<TestData>) => void;
    setBlueprint: (blueprint: BlueprintRow[]) => void;
    setSelectedItems: (items: number[]) => void;
    toggleItem: (id: number) => void;
    setGeneratedItems: (items: unknown[]) => void;
    initTest: (testId: string | null) => void;
    resetStore: () => void;
}

export const useTestDesignerStore = create<TestDesignerState>()(
    persist(
        (set, get) => ({
            step: 1,
            testId: null,
            testData: {
                testTitle: '',
                grade: '',
                subject: '',
                unit: '',
                items: []
            },
            blueprint: [
                { id: 1, oa: 'OA 04', topic: 'N\u00fameros Racionales', skill: 'Resolver Problemas', itemType: 'Selecci\u00f3n M\u00faltiple', count: 3 },
                { id: 2, oa: 'OA 04', topic: 'Operatoria con Fracciones', skill: 'Aplicar', itemType: 'Verdadero o Falso', count: 5 },
            ],
            selectedItems: [],
            generatedItems: [],

            setStep: (step) => set({ step }),

            setTestData: (data) => set((state) => ({
                testData: { ...state.testData, ...data }
            })),

            setBlueprint: (blueprint) => set({ blueprint }),

            setSelectedItems: (selectedItems) => set({ selectedItems }),

            toggleItem: (id) => set((state) => {
                const selectedItems = state.selectedItems.includes(id)
                    ? state.selectedItems.filter(i => i !== id)
                    : [...state.selectedItems, id];
                return { selectedItems };
            }),

            setGeneratedItems: (generatedItems) => set({ generatedItems }),

            initTest: (testId) => {
                const state = get();
                if (state.testId !== testId) {
                    // New test or different test, reset
                    set({
                        step: 1,
                        testId,
                        testData: {
                            testTitle: testId ? 'Evaluaci\u00f3n existente' : '',
                            grade: '',
                            subject: '',
                            unit: '',
                            items: []
                        },
                        blueprint: [
                            { id: 1, oa: 'OA 04', topic: 'N\u00fameros Racionales', skill: 'Resolver Problemas', itemType: 'Selecci\u00f3n M\u00faltiple', count: 3 },
                            { id: 2, oa: 'OA 04', topic: 'Operatoria con Fracciones', skill: 'Aplicar', itemType: 'Verdadero o Falso', count: 5 },
                        ],
                        selectedItems: [],
                        generatedItems: []
                    });
                }
            },

            resetStore: () => set({
                step: 1,
                testId: null,
                testData: { testTitle: '', grade: '', subject: '', unit: '', items: [] },
                blueprint: [
                    { id: 1, oa: 'OA 04', topic: 'N\u00fameros Racionales', skill: 'Resolver Problemas', itemType: 'Selecci\u00f3n M\u00faltiple', count: 3 },
                    { id: 2, oa: 'OA 04', topic: 'Operatoria con Fracciones', skill: 'Aplicar', itemType: 'Verdadero o Falso', count: 5 },
                ],
                selectedItems: [],
                generatedItems: []
            })
        }),
        {
            name: 'educmark-test-designer',
        }
    )
);
