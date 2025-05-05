import { Panel } from '../types';

/**
 * Applies spacing only to x and y, preserving all other panel properties.
 */
export function applyPanelSpacing(
  panels: Panel[],
  panelSpacing: number,
  rowSpacing: number,
  panelsPerRow: number
): Panel[] {
  return panels.map((panel, idx) => {
    const row = Math.floor(idx / panelsPerRow);
    const col = idx % panelsPerRow;
    // Use the panel's own width/length for correct orientation
    return {
      ...panel,
      x: col * (panel.width + panelSpacing),
      y: row * (panel.length + rowSpacing),
    };
  });
}

export function getSpacedPosition(x: number, y: number, panelSpacing: number, rowSpacing: number) {
    return {
      x: x + panelSpacing / 12,
      y: y + rowSpacing / 12
    };
  }
  
