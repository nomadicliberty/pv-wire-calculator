import { useCallback, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useProjectStore } from '../store';
import { Panel, CombinerBox } from '../types';
import { getSpacedPosition } from '../utils/panelSpacing';

const GRID_SIZE = 100; // 100x100 grid
const CELL_SIZE = 25; // pixels
const INCHES_PER_CELL = 12; // 1 foot = 12 inches per cell
const PIXELS_PER_INCH = CELL_SIZE / INCHES_PER_CELL;

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
  selectedCombinerBox?: string | null;
  isPolarityFlipped?: boolean;
  strings?: any[];
  applySpacing?: boolean;
  panels?: Panel[]; // ✅ Add this
  panelWidth?: number;
  panelLength?: number;
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
  selectedCombinerBox = null,
  isPolarityFlipped = false,
  strings: propStrings,
  applySpacing = false,
  panels: propPanels, // ✅ Grab optional panels from props
  panelWidth,
  panelLength
}: GridProps) {
  const {
    panelSpacing: storePanelSpacing = 0,
    rowSpacing: storeRowSpacing = 0,
    pixelsPerInch: storePixelsPerInch = PIXELS_PER_INCH,
    panels: storePanels = [],
    panelWidth: storePanelWidth = 0,
    panelLength: storePanelLength = 0,
    combinerBoxes: storeCombinerBoxes = [],
  } = useProjectStore();

  const gridRef = useRef<HTMLDivElement>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);

  // Use props if provided, otherwise fallback to store
  const panelSpacingToUse = storePanelSpacing;
  const rowSpacingToUse = storeRowSpacing;
  const panelsToUse = propPanels ?? storePanels;
  const selectedPanelsToUse = selectedPanels ?? new Set();
  const onPanelSelectToUse = onPanelSelect ?? undefined;
  const pixelsPerInchToUse = PIXELS_PER_INCH ?? storePixelsPerInch;
  const panelWidthToUse = typeof panelWidth !== 'undefined' ? panelWidth : storePanelWidth;
  const panelLengthToUse = typeof panelLength !== 'undefined' ? panelLength : storePanelLength;
  const combinerBoxesToUse = storeCombinerBoxes;
  const stringsToUse = propStrings ?? [];

  // Convert panel dimensions to grid cells and pixels
  const getPanelDimensions = () => {
    const width = Number(panelWidthToUse) || 0;
    const length = Number(panelLengthToUse) || 0;
    const spacing = Number(panelSpacingToUse) || 0;
    const rowGap = Number(rowSpacingToUse) || 0;

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

    // Panel snapping logic (always snap top-left corner)
    let snappedX = rawInchesX;
    let snappedY = rawInchesY;
    if (panelsToUse.length === 0) {
      snappedX = Math.floor(rawInchesX / INCHES_PER_CELL) * INCHES_PER_CELL;
      snappedY = Math.floor(rawInchesY / INCHES_PER_CELL) * INCHES_PER_CELL;
    } else {
      // For subsequent panels, check for snapping to existing panel edges
      let closestSnapXDist = Infinity;
      let closestSnapYDist = Infinity;
      let bestSnapX = snappedX;
      let bestSnapY = snappedY;
      const snapThreshold = 3; // inches
      const moveIncrement = 2;
      for (const panel of panelsToUse) {
        const w = panel.orientation === 'landscape' ? panel.length : panel.width;
        const h = panel.orientation === 'landscape' ? panel.width : panel.length;
        const left = panel.x;
        const right = panel.x + w;
        const top = panel.y;
        const bottom = panel.y + h;
        const distToLeft = Math.abs(rawInchesX - left);
        const distToRight = Math.abs(rawInchesX - right);
        const distToTop = Math.abs(rawInchesY - top);
        const distToBottom = Math.abs(rawInchesY - bottom);
        if (distToLeft < snapThreshold && distToLeft < closestSnapXDist) {
          closestSnapXDist = distToLeft;
          bestSnapX = left;
        }
        if (distToRight < snapThreshold && distToRight < closestSnapXDist) {
          closestSnapXDist = distToRight;
          bestSnapX = right;
        }
        if (distToTop < snapThreshold && distToTop < closestSnapYDist) {
          closestSnapYDist = distToTop;
          bestSnapY = top;
        }
        if (distToBottom < snapThreshold && distToBottom < closestSnapYDist) {
          closestSnapYDist = distToBottom;
          bestSnapY = bottom;
        }
      }
      snappedX = bestSnapX;
      snappedY = bestSnapY;
      // If not snapping to an edge, snap to 2 inch increments
      if (snappedX === rawInchesX) {
        snappedX = Math.round(rawInchesX / moveIncrement) * moveIncrement;
      }
      if (snappedY === rawInchesY) {
        snappedY = Math.round(rawInchesY / moveIncrement) * moveIncrement;
      }
    }
    setPreviewPosition({ x: snappedX, y: snappedY }); // Store in inches, top-left corner
  };
  
  

  const handleMouseLeave = useCallback(() => {
    setPreviewPosition(null);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placementMode || !previewPosition) return;
    const gridX = previewPosition.x;
    const gridY = previewPosition.y;
    if (showCombinerBoxes) {
      // Snap to 6-inch increments
      const boxX = Math.floor(previewPosition.x / 6) * 6;
      const boxY = Math.floor(previewPosition.y / 6) * 6;
      
      // Check for collision with existing combiner boxes
      const hasCollision = combinerBoxesToUse.some((box: CombinerBox) =>
        Math.abs(box.x - boxX) < 12 && Math.abs(box.y - boxY) < 12
      );
      
      // Check for collision with panels
      const panelCollision = panelsToUse.some(panel => {
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
    // New panel orientation and dimensions
    const newOrientation = orientation;
    // Always store raw user-entered values
    const rawWidth = Number(panelWidthToUse);
    const rawLength = Number(panelLengthToUse);
    // For collision and rendering, use orientation to interpret width/length
    const newPanelWidth = newOrientation === 'landscape' ? rawLength : rawWidth;
    const newPanelHeight = newOrientation === 'landscape' ? rawWidth : rawLength;
    const newPanelRect = {
      x: gridX,
      y: gridY,
      width: newPanelWidth,
      height: newPanelHeight,
    };
    // Collision check with existing panels
    const hasCollision = panelsToUse.some(panel => {
      // Always use orientation to interpret width/length
      const existingRawWidth = Number(panel.width);
      const existingRawLength = Number(panel.length);
      const existingWidth = panel.orientation === 'landscape' ? existingRawLength : existingRawWidth;
      const existingHeight = panel.orientation === 'landscape' ? existingRawWidth : existingRawLength;
      const panelRect = {
        x: panel.x,
        y: panel.y,
        width: existingWidth,
        height: existingHeight,
      };
      const epsilon = 0.1; // Allow edge-to-edge contact
      return !(
        newPanelRect.x + newPanelRect.width <= panelRect.x + epsilon ||
        newPanelRect.x >= panelRect.x + panelRect.width - epsilon ||
        newPanelRect.y + newPanelRect.height <= panelRect.y + epsilon ||
        newPanelRect.y >= panelRect.y + panelRect.height - epsilon
      );
    });
    if (hasCollision) return;
    console.log("Placing panel:", {
      orientation: newOrientation,
      rotation: 0,
      width: rawWidth,
      length: rawLength,
      x: gridX,
      y: gridY,
    });
    onPanelPlace?.({
      id: crypto.randomUUID(),
      number: 0,
      x: gridX,
      y: gridY,
      orientation: newOrientation,
      rotation: isPolarityFlipped ? 180 : 0,
      width: rawWidth, // Always store raw user-entered width
      length: rawLength, // Always store raw user-entered length
      polarity: isPolarityFlipped 
        ? { positive: 'right', negative: 'left' } as const
        : { positive: 'left', negative: 'right' } as const,
    });
    
  };
  

  const renderPanel = (panel: Panel) => {
    console.log("🔍 Panel Render Check", {
      orientation: panel.orientation,
      rawWidth: panel.width,
      rawLength: panel.length,
      renderedWidth: panel.orientation === 'landscape' ? panel.length : panel.width,
      renderedHeight: panel.orientation === 'landscape' ? panel.width : panel.length
    });
    
    // Use orientation to determine width and height
    const width = panel.orientation === 'landscape' ? panel.length : panel.width;
    const height = panel.orientation === 'landscape' ? panel.width : panel.length;

    const widthPx = width * pixelsPerInchToUse;
    const heightPx = height * pixelsPerInchToUse;
    const isSelected = selectedPanelsToUse?.has(panel.id);
    const spacingInInches = Number(panelSpacingToUse) / 12;
    const rowGapInInches = Number(rowSpacingToUse) / 12;
    const longSide = panel.orientation === 'landscape' ? panel.length : panel.width;
    const shortSide = panel.orientation === 'landscape' ? panel.width : panel.length;
    const widthInches = panel.orientation === 'landscape' ? panel.length : panel.width;
    const heightInches = panel.orientation === 'landscape' ? panel.width : panel.length;
  
    let adjustedX = panel.x;
    let adjustedY = panel.y;
  
    if (applySpacing) {
      // Sort panels primarily by their y-coordinate (row), then by x-coordinate (position in row)
      const sortedPanels = [...panelsToUse].sort((a, b) => {
        if (Math.abs(a.y - b.y) > 0.01) {
          return a.y - b.y;
        }
        return a.x - b.x;
      });
  
      const currentIndex = sortedPanels.findIndex(p => p.id === panel.id);
  
      if (currentIndex > 0) {
        const previousPanel = sortedPanels[currentIndex - 1];
        const previousLongSide = previousPanel.orientation === 'landscape' ? previousPanel.length : previousPanel.width;
        const previousShortSide = previousPanel.orientation === 'landscape' ? previousPanel.width : previousPanel.length;
  
        // If in the same row (similar y-coordinate)
        if (Math.abs(panel.y - previousPanel.y) < 0.01) {
          adjustedX = previousPanel.x + previousLongSide + spacingInInches;
        } else {
          // New row, align x and apply row spacing
          adjustedY = previousPanel.y + previousShortSide + rowGapInInches;
        }
      }
    }
  
    const centerX = adjustedX * pixelsPerInchToUse + widthPx / 2;
    const centerY = adjustedY * pixelsPerInchToUse + heightPx / 2;
  
    // Rotation-aware polarity symbol placement
    function rotatePolarity(polarity: { positive: string; negative: string }, rotation: number) {
      const order = ['left', 'top', 'right', 'bottom'];
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
  
    const polaritySymbols = (() => {
      const rotated = rotatePolarity(panel.polarity, panel.rotation);
      const symbols: { [key: string]: { x: number; y: number; symbol: string } } = {
        left: { x: 0.1, y: 0.5, symbol: rotated.positive === 'left' ? '+' : rotated.negative === 'left' ? '-' : '' },
        right: { x: 0.9, y: 0.5, symbol: rotated.positive === 'right' ? '+' : rotated.negative === 'right' ? '-' : '' },
        top: { x: 0.5, y: 0.1, symbol: rotated.positive === 'top' ? '+' : rotated.negative === 'top' ? '-' : '' },
        bottom: { x: 0.5, y: 0.9, symbol: rotated.positive === 'bottom' ? '+' : rotated.negative === 'bottom' ? '-' : '' }
      };
      return Object.values(symbols).filter(s => s.symbol);
    })();
  
    // Box style for upright number label (retained from your original)
    const numberBoxSx: any = {
      position: 'absolute',
      zIndex: 1,
      pointerEvents: 'none',
      left: '50%',
      transform: `rotate(${-panel.rotation}deg)`,
      ...(panel.rotation === 0 && { bottom: '4px' }),
      ...(panel.rotation === 180 && { top: '4px' }),
      ...(panel.rotation === 90 && {
        right: '4px', top: '50%',
        transform: `translateY(-50%) rotate(-90deg)`
      }),
      ...(panel.rotation === 270 && {
        left: '4px', top: '50%',
        transform: `translateY(-50%) rotate(-270deg)`
      }),
    };
  
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
          onPanelSelectToUse?.(panel);
        }}
      >
        {polaritySymbols.map((s, i) => (
          <Typography
            key={i}
            variant="h6"
            color="text.secondary"
            sx={{
              position: 'absolute',
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {s.symbol}
          </Typography>
        ))}
        <Box sx={numberBoxSx}>
          <Typography variant="body2" fontWeight="bold" fontSize="1rem">
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
            left: previewPosition.x * pixelsPerInchToUse,
            top: previewPosition.y * pixelsPerInchToUse,
            width: 12 * pixelsPerInchToUse,
            height: 12 * pixelsPerInchToUse,
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      );
    }
    // Use the correct panel dimensions for preview
    const panelWidthInches = orientation === 'landscape' ? Number(panelLengthToUse) : Number(panelWidthToUse);
    const panelHeightInches = orientation === 'landscape' ? Number(panelWidthToUse) : Number(panelLengthToUse);
    const leftSymbol = isPolarityFlipped ? '-' : '+';
    const rightSymbol = isPolarityFlipped ? '+' : '-';
    return (
      <Box
        sx={{
          position: 'absolute',
          left: previewPosition.x * pixelsPerInchToUse,
          top: previewPosition.y * pixelsPerInchToUse,
          width: panelWidthInches * pixelsPerInchToUse,
          height: panelHeightInches * pixelsPerInchToUse,
          border: '2px dashed',
          borderColor: 'primary.main',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          pointerEvents: 'none',
          zIndex: 100,
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
    // Get spacing values from store
    const spacing = Number(panelSpacingToUse) || 0;
    const rowGap = Number(rowSpacingToUse) || 0;

    return stringsToUse.map((string: any, index: number) => {
      const stringPanels = string.panels
        .map((panelId: string) => panelsToUse.find((panel: Panel) => panel.id === panelId))
        .filter((panel: Panel | undefined): panel is Panel => panel !== undefined);

      if (stringPanels.length === 0) return null;

      const combinerBox = combinerBoxesToUse.find((box: CombinerBox) => box.id === string.combinerBoxId);
      if (!combinerBox) return null;

      const firstPanel = stringPanels[0];
      const lastPanel = stringPanels[stringPanels.length - 1];

      // Helper to get terminal positions in inches, using polarity and accounting for spacing
      const getTerminalPosition = (panel: Panel, side: 'left' | 'right' | 'top' | 'bottom') => {
        const width = panel.width;
        const length = panel.length;
        let { x, y } = getSpacedPosition(panel.x, panel.y, spacing, rowGap);


        // Add spacing offsets based on panel position in string
        const panelIndex = stringPanels.indexOf(panel);
        const isLastPanel = panelIndex === stringPanels.length - 1;
        const isFirstPanel = panelIndex === 0;

        if (side === 'left') {
          x = panel.x;
          y = panel.y + length / 2;
          // Add row spacing for all panels except the first
          if (!isFirstPanel) {
            x += spacing;
          }
        } else if (side === 'right') {
          x = panel.x + width;
          y = panel.y + length / 2;
          // Add row spacing for all panels except the last
          if (!isLastPanel) {
            x += spacing;
          }
        } else if (side === 'top') {
          x = panel.x + width / 2;
          y = panel.y;
          // Add panel spacing for all panels except the first
          if (!isFirstPanel) {
            y += rowGap;
          }
        } else if (side === 'bottom') {
          x = panel.x + width / 2;
          y = panel.y + length;
          // Add panel spacing for all panels except the last
          if (!isLastPanel) {
            y += rowGap;
          }
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
          backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.1)' : 'rgba(100,100,100,0.1)',
          pointerEvents: 'auto',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: isSelected ? 'primary.main' : 'grey.500',
            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.2)' : 'rgba(100,100,100,0.2)',
          }
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
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        ref={gridRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          flex: 1,
          backgroundImage: `
            linear-gradient(to right, #e0e0e0 1px, transparent 1px),
            linear-gradient(to bottom, #e0e0e0 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          cursor: 'crosshair',
          overflow: 'hidden'
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setPreviewPosition(null)}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 10 }}
        >
          {renderWirePaths()}
        </svg>
        {panelsToUse.map(renderPanel)}
        {showCombinerBoxes && combinerBoxesToUse.map(renderCombinerBox)}
        {renderPreview()}
      </Paper>
    </Box>
  );
}
