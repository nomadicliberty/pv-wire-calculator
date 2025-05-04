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
  panelOutlineColor?: string;
  isPolarityFlipped?: boolean;
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
  selectedPanels = new Set(),
  panelOutlineColor = 'grey.500',
  isPolarityFlipped = false
}: GridProps) {
  const { panels, selectedPanel, setSelectedPanel, combinerBoxes, selectedCombinerBox, setSelectedCombinerBox, strings } = useProjectStore();
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
        number: 0, // This will be set by the store
        x: gridX,
        y: gridY,
        orientation,
        rotation: 0,
        width: orientation === 'portrait' ? 2 : 4,
        length: orientation === 'portrait' ? 4 : 2,
        polarity: {
          positive: 'left',
          negative: 'right'
        }
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
        number: 0, // This will be set by the store
        x: combinerX,
        y: combinerY,
        width: 1,
        height: 1
      });
    }
  };

  const renderPanel = (panel: Panel) => {
    const isSelected = selectedPanels.has(panel.id);
    const width = panel.orientation === 'landscape' ? 4 : 2;
    const height = panel.orientation === 'landscape' ? 2 : 4;

    // Find if this panel is part of a string
    const string = strings.find(s => s.panels.includes(panel.id));
    const stringIndex = string ? strings.indexOf(string) : -1;

    // Calculate center position for rotation
    const centerX = panel.x * CELL_SIZE + (width * CELL_SIZE) / 2;
    const centerY = panel.y * CELL_SIZE + (height * CELL_SIZE) / 2;

    // Define colors for different string states
    const getPanelColor = () => {
      if (isSelected) return 'primary.main';
      if (stringIndex >= 0) {
        // Use different colors for different strings
        const colors = ['success.main', 'warning.main', 'error.main', 'info.main'];
        return colors[stringIndex % colors.length];
      }
      return panelOutlineColor;
    };

    // Get polarity symbol positions based on panel's polarity
    const getPolaritySymbols = () => {
      const { positive, negative } = panel.polarity;
      const symbols: { [key: string]: { x: number; y: number; symbol: string } } = {
        left: { x: 0.1, y: 0.5, symbol: positive === 'left' ? '+' : '-' },
        right: { x: 0.9, y: 0.5, symbol: positive === 'right' ? '+' : '-' },
        top: { x: 0.5, y: 0.1, symbol: positive === 'top' ? '+' : '-' },
        bottom: { x: 0.5, y: 0.9, symbol: positive === 'bottom' ? '+' : '-' }
      };

      return [
        symbols[positive],
        symbols[negative]
      ];
    };

    const polaritySymbols = getPolaritySymbols();

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
          borderColor: getPanelColor(),
          backgroundColor: isSelected ? 'primary.light' : 'grey.200',
          cursor: 'pointer',
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
        {/* Polarity indicators that rotate with the panel */}
        {polaritySymbols.map((symbol, index) => (
          <Typography
            key={index}
            variant="h6"
            color="text.secondary"
            sx={{
              position: 'absolute',
              left: `${symbol.x * 100}%`,
              top: `${symbol.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              transformOrigin: 'center center'
            }}
          >
            {symbol.symbol}
          </Typography>
        ))}

        {/* Panel number that stays at the visual bottom and is always upright */}
        {(() => {
          let numberBoxSx: any = {
            position: 'absolute',
            zIndex: 1,
            pointerEvents: 'none',
            left: '50%',
            transform: `translateX(-50%) rotate(${-panel.rotation}deg)`
          };
          if (panel.rotation === 0) {
            numberBoxSx.bottom = '4px';
          } else if (panel.rotation === 180) {
            numberBoxSx.top = '4px';
          } else if (panel.rotation === 90) {
            numberBoxSx = {
              position: 'absolute',
              zIndex: 1,
              pointerEvents: 'none',
              right: '4px',
              top: '50%',
              left: 'auto',
              bottom: 'auto',
              transform: `translateY(-50%) rotate(-90deg)`
            };
          } else if (panel.rotation === 270) {
            numberBoxSx = {
              position: 'absolute',
              zIndex: 1,
              pointerEvents: 'none',
              left: '4px',
              top: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: `translateY(-50%) rotate(-270deg)`
            };
          }
          return (
            <Box sx={numberBoxSx}>
              <Typography 
                variant="body2" 
                color="text.primary"
                sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}
              >
                {panel.number}
              </Typography>
            </Box>
          );
        })()}
      </Box>
    );
  };

  const renderPanelPolarity = (panel: Panel, x: number, y: number, width: number, height: number) => {
    const isFlipped = panel.rotation === 180;
    const leftSymbol = isFlipped ? '-' : '+';
    const rightSymbol = isFlipped ? '+' : '-';

    return (
      <>
        <text
          x={x + width * 0.2}
          y={y + height * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize={12}
        >
          {leftSymbol}
        </text>
        <text
          x={x + width * 0.8}
          y={y + height * 0.5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize={12}
        >
          {rightSymbol}
        </text>
      </>
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.light' : 'grey.300',
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCombinerBox(box.id);
          onCombinerBoxSelect?.(box.id);
        }}
      >
        <Typography 
          variant="body2" 
          color="text.primary"
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          {box.number}
        </Typography>
      </Box>
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
      // Use the same spacing as placed panels
      const leftSymbol = isPolarityFlipped ? '-' : '+';
      const rightSymbol = isPolarityFlipped ? '+' : '-';
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
          }}
        >
          {/* Polarity symbols, spaced like placed panels */}
          <Typography
            variant="h6"
            color="primary.main"
            sx={{
              position: 'absolute',
              left: '10%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {leftSymbol}
          </Typography>
          <Typography
            variant="h6"
            color="primary.main"
            sx={{
              position: 'absolute',
              left: '90%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {rightSymbol}
          </Typography>
          {/* Faded numeric placeholder at the bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            <Typography 
              variant="body2" 
              color="primary.main"
              sx={{ fontSize: '0.875rem', fontWeight: 'bold', opacity: 0.3 }}
            >
              0
            </Typography>
          </Box>
        </Box>
      );
    }
  };

  const renderWirePaths = () => {
    return strings.map((string, index) => {
      const stringPanels = string.panels
        .map(panelId => panels.find(p => p.id === panelId))
        .filter((panel): panel is NonNullable<typeof panel> => panel !== undefined);

      if (stringPanels.length === 0) return null;

      const combinerBox = combinerBoxes.find(box => box.id === string.combinerBoxId);
      if (!combinerBox) return null;

      const firstPanel = stringPanels[0];
      const lastPanel = stringPanels[stringPanels.length - 1];

      // Calculate center positions
      const combinerCenterX = combinerBox.x * CELL_SIZE;
      const combinerCenterY = combinerBox.y * CELL_SIZE;

      const firstPanelWidth = firstPanel.orientation === 'landscape' ? 4 : 2;
      const firstPanelHeight = firstPanel.orientation === 'landscape' ? 2 : 4;
      const firstPanelCenterX = firstPanel.x * CELL_SIZE + (firstPanelWidth * CELL_SIZE) / 2;
      const firstPanelCenterY = firstPanel.y * CELL_SIZE + (firstPanelHeight * CELL_SIZE) / 2;

      const lastPanelWidth = lastPanel.orientation === 'landscape' ? 4 : 2;
      const lastPanelHeight = lastPanel.orientation === 'landscape' ? 2 : 4;
      const lastPanelCenterX = lastPanel.x * CELL_SIZE + (lastPanelWidth * CELL_SIZE) / 2;
      const lastPanelCenterY = lastPanel.y * CELL_SIZE + (lastPanelHeight * CELL_SIZE) / 2;

      // Define colors for different strings
      const colors = ['#4caf50', '#ff9800', '#f44336', '#2196f3'];
      const color = colors[index % colors.length];

      // Helper function to create a path that follows grid lines
      const createGridPath = (startX: number, startY: number, endX: number, endY: number) => {
        // First move horizontally, then vertically
        return `M ${startX} ${startY} L ${endX} ${startY} L ${endX} ${endY}`;
      };

      return (
        <g key={string.id}>
          {/* Positive wire (first panel to combiner box) */}
          <path
            d={createGridPath(firstPanelCenterX, firstPanelCenterY, combinerCenterX, combinerCenterY)}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4"
            fill="none"
          />
          {/* Negative wire (last panel to combiner box) */}
          <path
            d={createGridPath(lastPanelCenterX, lastPanelCenterY, combinerCenterX, combinerCenterY)}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4"
            fill="none"
          />
        </g>
      );
    });
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
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {renderWirePaths()}
      </svg>
      {panels.map(renderPanel)}
      {showCombinerBoxes && combinerBoxes.map(renderCombinerBox)}
      {showPreview && renderPreview()}
    </Paper>
  );
} 