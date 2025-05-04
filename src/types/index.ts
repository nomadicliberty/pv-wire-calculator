export type MeasurementSystem = 'imperial' | 'metric';

export interface Panel {
  id: string;
  number: number;
  x: number;
  y: number;
  orientation: 'portrait' | 'landscape';
  rotation: 0 | 90 | 180 | 270;
  width: number;
  length: number;
  polarity: {
    positive: 'left' | 'right' | 'top' | 'bottom';
    negative: 'left' | 'right' | 'top' | 'bottom';
  };
}

export interface CombinerBox {
  id: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface String {
  id: string;
  number: number;
  panels: string[]; // Array of panel IDs
  combinerBoxId: string;
  wirePath: {
    positive: any[];
    negative: any[];
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