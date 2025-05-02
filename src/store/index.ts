import { create } from 'zustand';
import { ProjectState, Panel, CombinerBox, String, MeasurementSystem } from '../types';

interface ProjectStore extends ProjectState {
  setMeasurementSystem: (system: MeasurementSystem) => void;
  addPanel: (panel: Panel) => void;
  updatePanel: (id: string, panel: Partial<Panel>) => void;
  removePanel: (id: string) => void;
  addCombinerBox: (box: CombinerBox) => void;
  updateCombinerBox: (id: string, box: Partial<CombinerBox>) => void;
  removeCombinerBox: (id: string) => void;
  addString: (string: String) => void;
  updateString: (id: string, string: Partial<String>) => void;
  removeString: (id: string) => void;
  setSelectedPanel: (id: string | null) => void;
  setSelectedCombinerBox: (id: string | null) => void;
  setSelectedString: (id: string | null) => void;
  undo: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  measurementSystem: 'imperial',
  panels: [],
  combinerBoxes: [],
  strings: [],
  selectedPanel: null,
  selectedCombinerBox: null,
  selectedString: null,

  setMeasurementSystem: (system) => set({ measurementSystem: system }),
  
  addPanel: (panel) => set((state) => ({ 
    panels: [...state.panels, panel] 
  })),
  
  updatePanel: (id, panel) => set((state) => ({
    panels: state.panels.map((p) => 
      p.id === id ? { ...p, ...panel } : p
    )
  })),
  
  removePanel: (id) => set((state) => ({
    panels: state.panels.filter((p) => p.id !== id)
  })),
  
  addCombinerBox: (box) => set((state) => ({
    combinerBoxes: [...state.combinerBoxes, box]
  })),
  
  updateCombinerBox: (id, box) => set((state) => ({
    combinerBoxes: state.combinerBoxes.map((b) =>
      b.id === id ? { ...b, ...box } : b
    )
  })),
  
  removeCombinerBox: (id) => set((state) => ({
    combinerBoxes: state.combinerBoxes.filter((b) => b.id !== id)
  })),
  
  addString: (string) => set((state) => ({
    strings: [...state.strings, string]
  })),
  
  updateString: (id, string) => set((state) => ({
    strings: state.strings.map((s) =>
      s.id === id ? { ...s, ...string } : s
    )
  })),
  
  removeString: (id) => set((state) => ({
    strings: state.strings.filter((s) => s.id !== id)
  })),
  
  setSelectedPanel: (id) => set({ selectedPanel: id }),
  setSelectedCombinerBox: (id) => set({ selectedCombinerBox: id }),
  setSelectedString: (id) => set({ selectedString: id }),
  
  undo: () => set((state) => {
    // TODO: Implement undo functionality
    return state;
  }),
})); 