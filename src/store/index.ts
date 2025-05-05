import { create } from 'zustand';
import { Panel, CombinerBox, String, MeasurementSystem } from '../types';

interface ProjectState {
  measurementSystem: MeasurementSystem;
  panels: Panel[];
  combinerBoxes: CombinerBox[];
  strings: String[];
  selectedPanel: string | null;
  selectedCombinerBox: string | null;
  nextPanelNumber: number;
  nextCombinerBoxNumber: number;
  panelWidth: string;
  panelLength: string;
  panelSpacing: string;
  rowSpacing: string;
  pixelsPerInch: number; // ✅ Add pixelsPerInch to the state
  setPixelsPerInch: (value: number) => void; // ✅ Add setter function
  addPanel: (panel: Panel) => void;
  updatePanel: (id: string, updates: Partial<Panel>) => void;
  removePanel: (id: string) => void;
  addCombinerBox: (box: Omit<CombinerBox, 'id' | 'number'>) => void;
  removeCombinerBox: (id: string) => void;
  addString: (string: Omit<String, 'id'>) => void;
  removeString: (id: string) => void;
  setSelectedPanel: (id: string | null) => void;
  setSelectedCombinerBox: (id: string | null) => void;
  setMeasurementSystem: (system: MeasurementSystem) => void;
  reset: () => void;
  saveProject: (projectName: string) => void;
  loadProject: () => Promise<void>;
  setPanelWidth: (width: string) => void;
  setPanelLength: (length: string) => void;
  setPanelSpacing: (spacing: string) => void;
  setRowSpacing: (spacing: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  measurementSystem: 'imperial',
  panels: [],
  combinerBoxes: [],
  strings: [],
  selectedPanel: null,
  selectedCombinerBox: null,
  nextPanelNumber: 1,
  nextCombinerBoxNumber: 1,
  panelWidth: '',
  panelLength: '',
  panelSpacing: '0.5',
  rowSpacing: '0.5',
  pixelsPerInch: 25 / 12, // ✅ Initialize pixelsPerInch here
  setPixelsPerInch: (value) => set({ pixelsPerInch: value }), // ✅ Implement the setter

  addPanel: (panel) => set((state) => ({
    panels: [...state.panels, panel],
    nextPanelNumber: state.nextPanelNumber + 1
  })),
  

  updatePanel: (id, updates) => set((state) => {
    const updatedPanels = state.panels.map(panel => {
      if (panel.id === id) {
        const newPanel = { ...panel, ...updates };
        console.log('updatePanel:', { id, oldPanel: panel, updates, newPanel });
        return newPanel;
      }
      return panel;
    });
    return { panels: updatedPanels };
  }),

  removePanel: (id) => set((state) => ({
    panels: state.panels.filter(panel => panel.id !== id)
  })),

  addCombinerBox: (box) => set((state) => ({
    combinerBoxes: [...state.combinerBoxes, { ...box, id: crypto.randomUUID(), number: state.nextCombinerBoxNumber }],
    nextCombinerBoxNumber: state.nextCombinerBoxNumber + 1
  })),

  removeCombinerBox: (id) => set((state) => ({
    combinerBoxes: state.combinerBoxes.filter(box => box.id !== id)
  })),

  addString: (string) => set((state) => ({
    strings: [...state.strings, { ...string, id: crypto.randomUUID() }]
  })),

  removeString: (id) => set((state) => ({
    strings: state.strings.filter(string => string.id !== id)
  })),

  setSelectedPanel: (id) => set({ selectedPanel: id }),
  setSelectedCombinerBox: (id) => set({ selectedCombinerBox: id }),
  setMeasurementSystem: (system) => set({ measurementSystem: system }),

  reset: () => set({
    measurementSystem: 'imperial',
    panels: [],
    combinerBoxes: [],
    strings: [],
    selectedPanel: null,
    selectedCombinerBox: null,
    nextPanelNumber: 1,
    nextCombinerBoxNumber: 1,
    panelWidth: '',
    panelLength: '',
    panelSpacing: '0.5',
    rowSpacing: '0.5',
    pixelsPerInch: 25 / 12, // ✅ Reset pixelsPerInch as well
  }),

  saveProject: (projectName: string) => {
    const state = get();
    const projectData = {
      name: projectName,
      measurementSystem: state.measurementSystem,
      panels: state.panels,
      combinerBoxes: state.combinerBoxes,
      strings: state.strings,
      nextPanelNumber: state.nextPanelNumber,
      nextCombinerBoxNumber: state.nextCombinerBoxNumber,
      panelWidth: state.panelWidth,
      panelLength: state.panelLength,
      panelSpacing: state.panelSpacing,
      rowSpacing: state.rowSpacing,
      pixelsPerInch: state.pixelsPerInch, // ✅ Save pixelsPerInch
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `${safeProjectName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  loadProject: async () => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const projectData = JSON.parse(event.target?.result as string);
            set({
              measurementSystem: projectData.measurementSystem,
              panels: projectData.panels,
              combinerBoxes: projectData.combinerBoxes,
              strings: projectData.strings,
              nextPanelNumber: projectData.nextPanelNumber,
              nextCombinerBoxNumber: projectData.nextCombinerBoxNumber,
              selectedPanel: null,
              selectedCombinerBox: null,
              panelWidth: projectData.panelWidth,
              panelLength: projectData.panelLength,
              panelSpacing: projectData.panelSpacing,
              rowSpacing: projectData.rowSpacing,
              pixelsPerInch: projectData.pixelsPerInch, // ✅ Load pixelsPerInch
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      };

      input.click();
    });
  },

  setPanelWidth: (width) => set({ panelWidth: width }),
  setPanelLength: (length) => set({ panelLength: length }),
  setPanelSpacing: (spacing) => set({ panelSpacing: spacing }),
  setRowSpacing: (spacing) => set({ rowSpacing: spacing }),
}));