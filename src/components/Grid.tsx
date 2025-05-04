import { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useProjectStore } from '../store';
import { Panel, CombinerBox } from '../types';

const GRID_SIZE = 100; // 100x100 grid
const CELL_SIZE = 25; // pixels (2500/100 = 25 pixels per cell)
const INCHES_PER_CELL = 12; // 1 foot = 12 inches per cell
const PIXELS_PER_INCH = CELL_SIZE / INCHES_PER_CELL; // pixels per inch

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
strings?: any[];
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
isPolarityFlipped = false,
strings: propStrings
}: GridProps) {
const {
panels,
selectedPanel,
setSelectedPanel,
combinerBoxes,
selectedCombinerBox,
setSelectedCombinerBox,
strings: storeStrings,
panelWidth,
panelLength,
panelSpacing,
rowSpacing
} = useProjectStore();
const strings = propStrings ?? storeStrings;
const gridRef = useRef<HTMLDivElement>(null);
const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);

// Convert panel dimensions to grid cells and pixels
const getPanelDimensions = () => {
const width = Number(panelWidth) || 0;
const length = Number(panelLength) || 0;
const spacing = Number(panelSpacing) || 0;
const rowGap = Number(rowSpacing) || 0;

// Convert to grid cells (1 cell = 12 inches)
const widthCells = width / 12;
const lengthCells = length / 12;
const spacingCells = spacing / 12;
const rowGapCells = rowGap / 12;
// Convert to pixels
const widthPx = widthCells * CELL_SIZE;
const lengthPx = lengthCells * CELL_SIZE;

return {
  widthCells: orientation === 'landscape' ? lengthCells : widthCells,
  heightCells: orientation === 'landscape' ? widthCells : lengthCells,
  widthPx: orientation === 'landscape' ? lengthPx : widthPx,
  heightPx: orientation === 'landscape' ? widthPx : lengthPx,
  spacingCells,
  rowGapCells
};
};

const panelDimensions = getPanelDimensions();

const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
if (!placementMode || !gridRef.current) return;
const rect = gridRef.current.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
if (x < 0 || x >= GRID_SIZE * CELL_SIZE || y < 0 || y >= GRID_SIZE * CELL_SIZE) {
  setPreviewPosition(null);
  return;
}
const rawInchesX = x / PIXELS_PER_INCH;
const rawInchesY = y / PIXELS_PER_INCH;

if (showCombinerBoxes) {
  // Snap to 6-inch increments for combiner boxes
  const snappedX = Math.floor(rawInchesX / 6) * 6;
  const snappedY = Math.floor(rawInchesY / 6) * 6;
  setPreviewPosition({ x: snappedX, y: snappedY });
  return;
}

// Panel snapping logic
let snappedX = Math.floor(rawInchesX / INCHES_PER_CELL) * INCHES_PER_CELL;
let snappedY = Math.floor(rawInchesY / INCHES_PER_CELL) * INCHES_PER_CELL;
// Hybrid snapping: if close to last panel's edge, snap to that edge
if (panels.length > 0) {
  const last = panels[panels.length - 1];
  const lastWidth = last.orientation === 'landscape' ? last.length : last.width;
  const lastHeight = last.orientation === 'landscape' ? last.width : last.length;
  // If close to last panel's right edge, snap to it
  if (Math.abs(rawInchesX - (last.x + lastWidth)) < 1) snappedX = last.x + lastWidth;
  // If close to last panel's left edge, snap to it
  if (Math.abs(rawInchesX - last.x) < 1) snappedX = last.x;
  // If close to last panel's bottom edge, snap to it
  if (Math.abs(rawInchesY - (last.y + lastHeight)) < 1) snappedY = last.y + lastHeight;
  // If close to last panel's top edge, snap to it
  if (Math.abs(rawInchesY - last.y) < 1) snappedY = last.y;
}
setPreviewPosition({ x: snappedX, y: snappedY }); // Store in inches
};

const handleMouseLeave = useCallback(() => {
setPreviewPosition(null);
}, []);

const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
if (!placementMode || !previewPosition) return;
const gridX = previewPosition.x; // inches
const gridY = previewPosition.y; // inches
if (showCombinerBoxes) {
  // Snap to 6-inch increments
  const boxX = Math.floor(previewPosition.x / 6) * 6;
  const boxY = Math.floor(previewPosition.y / 6) * 6;
  // Check for collision with existing combiner boxes
  const hasCollision = combinerBoxes.some(box =>
    Math.abs(box.x - boxX) < 12 && Math.abs(box.y - boxY) < 12
  );
  // Check for collision with panels
  const panelCollision = panels.some(panel => {
    const width = panel.orientation === 'landscape' ? panel.length : panel.width;
    const height = panel.orientation === 'landscape' ? panel.width : panel.length;
    return (
      boxX < panel.x + width &&
      boxX + 12 > panel.x &&
      boxY < panel.y + height &&
      boxY + 12 > panel.y
    );
  });
  if (hasCollision || panelCollision) return;
  onCombinerBoxPlace?.({
    id: crypto.randomUUID(),
    number: 0,
    x: boxX,
    y: boxY,
    width: 12,
    height: 12
  });
  return;
}
const newPanelWidth = orientation === 'landscape' ? Number(panelLength) : Number(panelWidth);
const newPanelHeight = orientation === 'landscape' ? Number(panelWidth) : Number(panelLength);
const newPanelRect = { x: gridX, y: gridY, width: newPanelWidth, height: newPanelHeight };
const hasCollision = panels.some(panel => {
  const width = panel.orientation === 'landscape' ? panel.length : panel.width;
  const height = panel.orientation === 'landscape' ? panel.width : panel.length;
  const panelRect = { x: panel.x, y: panel.y, width, height };
  return !(
    newPanelRect.x + newPanelRect.width <= panelRect.x ||
    newPanelRect.x >= panelRect.x + panelRect.width ||
    newPanelRect.y + newPanelRect.height <= panelRect.y ||
    newPanelRect.y >= panelRect.y + panelRect.height
  );
});
if (hasCollision) return;
onPanelPlace?.({
  id: crypto.randomUUID(),
  number: 0,
  x: gridX,
  y: gridY,
  orientation,
  rotation: 0 as 0 | 90 | 180 | 270,
  width: newPanelWidth,
  length: newPanelHeight,
  polarity: { positive: 'left', negative: 'right' } as const
});
};

const renderPanel = (panel: Panel) => {
const widthPx = panel.width * PIXELS_PER_INCH;
const heightPx = panel.length * PIXELS_PER_INCH;
const isSelected = selectedPanels && selectedPanels.has(panel.id);
// Helper to rotate polarity directions based on panel rotation
function rotatePolarity(polarity: { positive: string; negative: string }, rotation: number) {
  const order = ['top', 'right', 'bottom', 'left'];
  const rotateIndex = (side: string, steps: number) => {
    const idx = order.indexOf(side);
    return order[(idx + steps) % 4];
  };
  const steps = (rotation / 90) % 4;
  return {
    positive: rotateIndex(polarity.positive, steps),
    negative: rotateIndex(polarity.negative, steps)
  };
}
const getPolaritySymbols = () => {
  const rotatedPolarity = rotatePolarity(panel.polarity, panel.rotation);
  const symbols: { [key: string]: { x: number; y: number; symbol: string } } = {
    left: { x: 0.1, y: 0.5, symbol: rotatedPolarity.positive === 'left' ? '+' : rotatedPolarity.negative === 'left' ? '-' : '' },
    right: { x: 0.9, y: 0.5, symbol: rotatedPolarity.positive === 'right' ? '+' : rotatedPolarity.negative === 'right' ? '-' : '' },
    top: { x: 0.5, y: 0.1, symbol: rotatedPolarity.positive === 'top' ? '+' : rotatedPolarity.negative === 'top' ? '-' : '' },
    bottom: { x: 0.5, y: 0.9, symbol: rotatedPolarity.positive === 'bottom' ? '+' : rotatedPolarity.negative === 'bottom' ? '-' : '' }
  };
  return Object.values(symbols).filter(s => s.symbol);
};
const polaritySymbols = getPolaritySymbols();
// Panel number box logic for always-at-bottom
let numberBoxSx: any = {
  position: 'absolute',
  zIndex: 1,
  pointerEvents: 'none',
  left: '50%',
  transform: `rotate(${-panel.rotation}deg)`
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
// Center position for rotation
const centerX = panel.x * PIXELS_PER_INCH + widthPx / 2;
const centerY = panel.y * PIXELS_PER_INCH + heightPx / 2;
return (
  <Box
    key={panel.id}
    sx={{
      position: 'absolute',
      left: centerX,
      top: centerY,
      width: widthPx,
      height: heightPx,
      border: '2px solid',
      borderColor: isSelected ? 'primary.main' : 'grey.300',
      backgroundColor: isSelected ? 'primary.light' : 'rgba(100,100,100,0.1)',
      pointerEvents: 'auto',
      transform: `translate(-50%, -50%) rotate(${panel.rotation}deg)`,
      transformOrigin: 'center center',
    }}
    onClick={e => {
      e.stopPropagation();
      if (onPanelSelect) onPanelSelect(panel);
    }}
  >
    {/* Polarity indicators */}
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
    {/* Panel number, always upright at the visual bottom */}
    <Box sx={numberBoxSx}>
      <Typography variant="body2" color="text.primary" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
        {panel.number}
      </Typography>
    </Box>
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
        left: previewPosition.x * PIXELS_PER_INCH,
        top: previewPosition.y * PIXELS_PER_INCH,
        width: INCHES_PER_CELL * PIXELS_PER_INCH,
        height: INCHES_PER_CELL * PIXELS_PER_INCH,
        border: '2px dashed',
        borderColor: 'primary.main',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        pointerEvents: 'none',
      }}
    />
  );
}
const panelWidthInches = orientation === 'landscape' ? Number(panelLength) : Number(panelWidth);
const panelHeightInches = orientation === 'landscape' ? Number(panelWidth) : Number(panelLength);
const leftSymbol = isPolarityFlipped ? '-' : '+';
const rightSymbol = isPolarityFlipped ? '+' : '-';
return (
  <Box
    sx={{
      position: 'absolute',
      left: previewPosition.x * PIXELS_PER_INCH,
      top: previewPosition.y * PIXELS_PER_INCH,
      width: panelWidthInches * PIXELS_PER_INCH,
      height: panelHeightInches * PIXELS_PER_INCH,
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
        sx={{ fontSize: '1rem', fontWeight: 'bold', opacity: 0.3 }}
      >
        0
      </Typography>
    </Box>
  </Box>
);
};

const renderWirePaths = () => {
  return strings.map((string: any, index: number) => {
    const stringPanels = string.panels
      .map((panelId: string) => panels.find((panel: Panel) => panel.id === panelId))
      .filter((panel: Panel | undefined): panel is Panel => panel !== undefined);

    if (stringPanels.length === 0) return null;

    const combinerBox = combinerBoxes.find(box => box.id === string.combinerBoxId);
    if (!combinerBox) return null;

    const firstPanel = stringPanels[0];
    const lastPanel = stringPanels[stringPanels.length - 1];

    // Helper to get terminal positions in inches, using polarity
    const getTerminalPosition = (panel: Panel, side: 'left' | 'right' | 'top' | 'bottom') => {
      const width = panel.width;
      const length = panel.length;
      let x = panel.x;
      let y = panel.y;
      if (side === 'left') {
        x = panel.x;
        y = panel.y + length / 2;
      } else if (side === 'right') {
        x = panel.x + width;
        y = panel.y + length / 2;
      } else if (side === 'top') {
        x = panel.x + width / 2;
        y = panel.y;
      } else if (side === 'bottom') {
        x = panel.x + width / 2;
        y = panel.y + length;
      }
      return { x: x * PIXELS_PER_INCH, y: y * PIXELS_PER_INCH };
    };

    // Use actual polarity for terminal positions
    const firstPanelPositive = getTerminalPosition(firstPanel, firstPanel.polarity.positive);
    const lastPanelNegative = getTerminalPosition(lastPanel, lastPanel.polarity.negative);
    // Combiner box bottom center in pixels
    const combinerBottomCenterX = (combinerBox.x + combinerBox.width / 2) * PIXELS_PER_INCH;
    const combinerBottomCenterY = (combinerBox.y + combinerBox.height) * PIXELS_PER_INCH;

    // Helper function to create a Manhattan path in pixels
    const createManhattanPath = (startX: number, startY: number, endX: number, endY: number) => {
      return `M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`;
    };

    return (
      <g key={string.id}>
        {/* Positive wire (first panel to combiner box) */}
        <path
          d={createManhattanPath(
            firstPanelPositive.x,
            firstPanelPositive.y,
            combinerBottomCenterX,
            combinerBottomCenterY
          )}
          stroke="#f44336" // Red for positive
          strokeWidth={2}
          strokeDasharray="4"
          fill="none"
        />
        {/* Negative wire (last panel to combiner box) */}
        <path
          d={createManhattanPath(
            lastPanelNegative.x,
            lastPanelNegative.y,
            combinerBottomCenterX,
            combinerBottomCenterY
          )}
          stroke="#222" // Black for negative
          strokeWidth={2}
          strokeDasharray="4"
          fill="none"
        />
      </g>
    );
  });
};

const renderCombinerBox = (box: CombinerBox) => {
  const isSelected = selectedCombinerBox === box.id;
  return (
    <Box
      key={box.id}
      sx={{
        position: 'absolute',
        left: box.x * PIXELS_PER_INCH,
        top: box.y * PIXELS_PER_INCH,
        width: box.width * PIXELS_PER_INCH,
        height: box.height * PIXELS_PER_INCH,
        border: '2px solid',
        borderColor: isSelected ? 'primary.main' : 'grey.700',
        backgroundColor: isSelected ? 'primary.light' : 'rgba(100,100,100,0.1)',
        pointerEvents: 'auto',
      }}
      onClick={e => {
        e.stopPropagation();
        if (onCombinerBoxSelect) onCombinerBoxSelect(box.id);
      }}
    >
      <Typography
        variant="body2"
        color="text.primary"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}
      >
        {box.number}
      </Typography>
    </Box>
  );
};

return (
  <Box sx={{ width: '100vw', height: '80vh', m: 0, p: 0 }}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      {showCombinerBoxes 
        ? "Note: Each grid cell represents 12\" spacing. Combiner boxes will snap to half-grid increments (6\")."
        : "Note: Each grid cell represents 12\" spacing."}
    </Typography>
    <Paper
      ref={gridRef}
      sx={{
        position: 'relative',
        minWidth: '100vw',
        minHeight: '80vh',
        width: '100vw',
        height: '80vh',
        backgroundImage: `linear-gradient(to right, #e0e0e0 1px, transparent 1px), linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)`,
        backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        cursor: 'crosshair',
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPreviewPosition(null)}
    >
      {panels.map(renderPanel)}
      {showCombinerBoxes && combinerBoxes.map(renderCombinerBox)}
      {renderPreview()}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 10 }}
      >
        {renderWirePaths()}
      </svg>
    </Paper>
  </Box>
);
}
