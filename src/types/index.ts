export type MeasurementSystem = 'imperial' | 'metric';

export interface Panel {
  id: string;
  width: number;
  length: number;
  x: number;
  y: number;
  orientation: 'portrait' | 'landscape';
  rotation: 0 | 90 | 180 | 270;
}

export interface CombinerBox {
  id: string;
  x: number;
  y: number;
}

export interface String {
  id: string;
  panels: string[]; // Array of panel IDs
  combinerBoxId: string;
  wirePath: {
    positive: Point[];
    negative: Point[];
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface ProjectState {
  measurementSystem: MeasurementSystem;
  panels: Panel[];
  combinerBoxes: CombinerBox[];
  strings: String[];
  selectedPanel: string | null;
  selectedCombinerBox: string | null;
  selectedString: string | null;
} 