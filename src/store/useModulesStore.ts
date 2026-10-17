import { create } from 'zustand';
import { Module, Assessment, Goal } from '../types/index';

interface ModuleWithData extends Module {
  assessments: Assessment[];
  goal: Goal | null;
}

interface ModulesState {
  modules: ModuleWithData[];
  setModules: (modules: ModuleWithData[]) => void;
  addModule: (module: ModuleWithData) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  removeModule: (id: string) => void;
  setAssessments: (moduleId: string, assessments: Assessment[]) => void;
  setGoal: (moduleId: string, goal: Goal | null) => void;
}

export const useModulesStore = create<ModulesState>((set) => ({
  modules: [],
  setModules: (modules) => set({ modules }),
  addModule: (module) =>
    set((state) => ({ modules: [...state.modules, module] })),
  updateModule: (id, updates) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  removeModule: (id) =>
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
    })),
  setAssessments: (moduleId, assessments) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === moduleId ? { ...m, assessments } : m
      ),
    })),
  setGoal: (moduleId, goal) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === moduleId ? { ...m, goal } : m
      ),
    })),
}));