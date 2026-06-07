// src/store/useBuilderStore.ts
import { create } from "zustand";
import { PortfolioSection } from "../features/portfolio-builder/types/portfolio";

interface BuilderState {
  // --- Current State ---
  sections: PortfolioSection[];
  themeConfig: Record<string, any>;
  hasUnsavedChanges: boolean;

  // --- History Stacks ---
  past: { sections: PortfolioSection[]; themeConfig: Record<string, any> }[];
  future: { sections: PortfolioSection[]; themeConfig: Record<string, any> }[];

  // --- Actions ---
  setInitialState: (
    sections: PortfolioSection[],
    themeConfig: Record<string, any>
  ) => void;
  addSection: (section: PortfolioSection) => void;
  removeSection: (id: string) => void;
  updateSection: (
    id: string,
    newSectionData: Partial<PortfolioSection>
  ) => void;
  reorderSections: (newSections: PortfolioSection[]) => void;
  updateThemeConfig: (newConfig: Record<string, any>) => void;
  markSaved: () => void;

  // --- Time Travel ---
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY_STATES = 50; // Prevents memory bloat

// Helper to save history snapshot before a change
const saveHistory = (state: BuilderState) => {
  const newPast = [
    ...state.past,
    { sections: state.sections, themeConfig: state.themeConfig },
  ];
  // If we exceed max history, drop the oldest state
  if (newPast.length > MAX_HISTORY_STATES) {
    newPast.shift();
  }
  return {
    past: newPast,
    future: [], // Clear future stack when a new action is performed
    hasUnsavedChanges: true,
  };
};

export const useBuilderStore = create<BuilderState>((set) => ({
  sections: [],
  themeConfig: {},
  hasUnsavedChanges: false,
  past: [],
  future: [],

  // Initialize without triggering an "unsaved change"
  setInitialState: (sections, themeConfig) =>
    set({
      sections,
      themeConfig,
      past: [],
      future: [],
      hasUnsavedChanges: false,
    }),

  addSection: (section) =>
    set((state) => ({
      ...saveHistory(state),
      sections: [...state.sections, section],
    })),

  removeSection: (id) =>
    set((state) => ({
      ...saveHistory(state),
      sections: state.sections.filter((s) => s.id !== id),
    })),

  updateSection: (id, newSectionData) =>
    set((state) => ({
      ...saveHistory(state),
      sections: state.sections.map((s) => {
        if (s.id === id) {
          // Deep merge for data and settings to ensure we don't overwrite nested objects with undefined
          return {
            ...s,
            ...newSectionData,
            data: { ...s.data, ...(newSectionData.data || {}) },
            settings: { ...s.settings, ...(newSectionData.settings || {}) },
          };
        }
        return s;
      }),
    })),

  reorderSections: (newSections) =>
    set((state) => ({
      ...saveHistory(state),
      sections: newSections,
    })),

  updateThemeConfig: (newConfig) =>
    set((state) => ({
      ...saveHistory(state),
      themeConfig: { ...state.themeConfig, ...newConfig },
    })),

  markSaved: () => set({ hasUnsavedChanges: false }),

  // --- UNDO / REDO LOGIC ---
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;

      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);

      return {
        past: newPast,
        future: [
          { sections: state.sections, themeConfig: state.themeConfig },
          ...state.future,
        ],
        sections: previous.sections,
        themeConfig: previous.themeConfig,
        hasUnsavedChanges: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;

      const next = state.future[0];
      const newFuture = state.future.slice(1);

      return {
        past: [
          ...state.past,
          { sections: state.sections, themeConfig: state.themeConfig },
        ],
        future: newFuture,
        sections: next.sections,
        themeConfig: next.themeConfig,
        hasUnsavedChanges: true,
      };
    }),
}));
