import { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useProjectStore } from '../store';
import { Panel, CombinerBox } from '../types';

const GRID_SIZE = 50;
const CELL_SIZE = 20; // pixels

interface GridProps {
  orientation: 'portrait' | 'landscape';
  showPreview?: boolean;
  showCombinerBoxes?: boolean;
  onPanelPlace?: (panel: Panel) => void;
  onCombinerBoxPlace?: (box: CombinerBox) => void;
  placementMode?: boolean;
  onPanelSelect?: (panel: Panel) => void;
  onCombinerBoxSelect?: (boxId: string) => void;
  selectedPanels?: Set<string>;
}

export default function Grid({ 
  orientation, 
  showPreview = true,
  showCombinerBoxes = false,
  onPanelPlace,
  onCombinerBoxPlace,
  placementMode = false,
  onPanelSelect,
  onCombinerBoxSelect,
  selectedPanels = new Set()
}: GridProps) {
  const { panels, selectedPanel, setSelectedPanel, combinerBoxes, selectedCombinerBox, setSelectedCombinerBox } = useProjectStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode || !gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ensure we're within grid bounds
    if (x < 0 || x >= GRID_SIZE * CELL_SIZE || y < 0 || y >= GRID_SIZE * CELL_SIZE) {
      setPreviewPosition(null);
      return;
    }

    if (showCombinerBoxes) {
      // For combiner boxes, snap to half grid increments
      const snapX = Math.round(x / (CELL_SIZE / 2)) * (CELL_SIZE / 2);
      const snapY = Math.round(y / (CELL_SIZE / 2)) * (CELL_SIZE / 2);
      setPreviewPosition({ x: snapX, y: snapY });
    } else {
      // For panels, snap to full grid increments
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);

      // Check if panel would fit within grid bounds
      const panelWidth = orientation === 'landscape' ? 4 : 2;
      const panelHeight = orientation === 'landscape' ? 2 : 4;

      if (gridX + panelWidth > GRID_SIZE || gridY + panelHeight > GRID_SIZE) {
        setPreviewPosition(null);
        return;
      }

      setPreviewPosition({ x: gridX * CELL_SIZE, y: gridY * CELL_SIZE });
    }
  };

  const handleMouseLeave = useCallback(() => {
    setPreviewPosition(null);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode) {
      // Handle selection
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to grid coordinates
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);

      // Check if clicked on a panel
      const clickedPanel = panels.find(panel => 
        panel.x === gridX && 
        panel.y === gridY
      );

      if (clickedPanel) {
        setSelectedPanel(clickedPanel.id);
        onPanelSelect?.(clickedPanel);
        return;
      }

      // Check if clicked on a combiner box (using half grid increments)
      const snapX = Math.round(x / (CELL_SIZE / 2)) * (CELL_SIZE / 2);
      const snapY = Math.round(y / (CELL_SIZE / 2)) * (CELL_SIZE / 2);
      const combinerX = snapX / CELL_SIZE;
      const combinerY = snapY / CELL_SIZE;

      const clickedCombiner = combinerBoxes.find(box => 
        box.x === combinerX && 
        box.y === combinerY
      );

      if (clickedCombiner) {
        setSelectedCombinerBox(clickedCombiner.id);
        onCombinerBoxSelect?.(clickedCombiner.id);
        return;
      }

      // If clicked on empty space, deselect
      setSelectedPanel(null);
      setSelectedCombinerBox(null);
      return;
    }

    if (!previewPosition) return;

    // For panels, use full grid increments
    if (!showCombinerBoxes) {
      const gridX = Math.floor(previewPosition.x / CELL_SIZE);
      const gridY = Math.floor(previewPosition.y / CELL_SIZE);

      // Check for collisions with existing panels
      const hasCollision = panels.some(panel => 
        panel.x === gridX && 
        panel.y === gridY
      );

      if (hasCollision) {
        return;
      }

      onPanelPlace?.({
        id: crypto.randomUUID(),
        x: gridX,
        y: gridY,
        orientation,
        rotation: 0,
        width: orientation === 'portrait' ? 2 : 4,
        length: orientation === 'portrait' ? 4 : 2
      });
    } else {
      // For combiner boxes, use half grid increments
      const combinerX = previewPosition.x / CELL_SIZE;
      const combinerY = previewPosition.y / CELL_SIZE;

      // Check for collisions with existing combiner boxes
      const hasCollision = combinerBoxes.some(box => 
        box.x === combinerX && 
        box.y === combinerY
      );

      if (hasCollision) {
        return;
      }

      onCombinerBoxPlace?.({
        id: crypto.randomUUID(),
        x: combinerX,
        y: combinerY
      });
    }
  };

  const renderPanel = (panel: Panel) => {
    const isSelected = selectedPanels.has(panel.id);
    const width = panel.orientation === 'landscape' ? 4 : 2;
    const height = panel.orientation === 'landscape' ? 2 : 4;
    const isFlipped = panel.rotation === 180;

    // Calculate center position for rotation
    const centerX = panel.x * CELL_SIZE + (width * CELL_SIZE) / 2;
    const centerY = panel.y * CELL_SIZE + (height * CELL_SIZE) / 2;

    return (
      <Box
        key={panel.id}
        sx={{
          position: 'absolute',
          left: centerX,
          top: centerY,
          width: width * CELL_SIZE,
          height: height * CELL_SIZE,
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : 'grey.500',
          backgroundColor: isSelected ? 'primary.light' : 'grey.200',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 4px',
          transform: `translate(-50%, -50%) rotate(${panel.rotation}deg)`,
          transformOrigin: 'center center',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.light' : 'grey.300',
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPanelSelect?.(panel);
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {isFlipped ? '-' : '+'}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {isFlipped ? '+' : '-'}
        </Typography>
      </Box>
    );
  };

  const renderCombinerBox = (box: CombinerBox) => {
    const isSelected = box.id === selectedCombinerBox;

    return (
      <Box
        key={box.id}
        sx={{
          position: 'absolute',
          left: box.x * CELL_SIZE - CELL_SIZE / 2,
          top: box.y * CELL_SIZE - CELL_SIZE / 2,
          width: CELL_SIZE,
          height: CELL_SIZE,
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : 'grey.500',
          backgroundColor: isSelected ? 'primary.light' : 'grey.200',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.light' : 'grey.300',
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCombinerBox(box.id);
        }}
      />
    );
  };

  const renderPreview = () => {
    if (!previewPosition || !showPreview) return null;

    if (showCombinerBoxes) {
      return (
        <Box
          sx={{
            position: 'absolute',
            left: previewPosition.x - CELL_SIZE / 2,
            top: previewPosition.y - CELL_SIZE / 2,
            width: CELL_SIZE,
            height: CELL_SIZE,
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointerEvents: 'none',
          }}
        />
      );
    } else {
      const previewWidth = orientation === 'landscape' ? 4 : 2;
      const previewHeight = orientation === 'landscape' ? 2 : 4;
      const isFlipped = false; // Preview always starts with default polarity

      return (
        <Box
          sx={{
            position: 'absolute',
            left: previewPosition.x,
            top: previewPosition.y,
            width: previewWidth * CELL_SIZE,
            height: previewHeight * CELL_SIZE,
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          <Typography variant="h6" color="primary.main">{isFlipped ? '-' : '+'}</Typography>
          <Typography variant="h6" color="primary.main">{isFlipped ? '+' : '-'}</Typography>
        </Box>
      );
    }
  };

  return (
    <Paper
      ref={gridRef}
      sx={{
        position: 'relative',
        width: GRID_SIZE * CELL_SIZE,
        height: GRID_SIZE * CELL_SIZE,
        backgroundImage: `
          linear-gradient(to right, #e0e0e0 1px, transparent 1px),
          linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
        `,
        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        cursor: 'crosshair',
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {panels.map(renderPanel)}
      {showCombinerBoxes && combinerBoxes.map(renderCombinerBox)}
      {showPreview && renderPreview()}
    </Paper>
  );
} 