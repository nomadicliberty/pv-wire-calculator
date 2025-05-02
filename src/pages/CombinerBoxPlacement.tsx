import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { useProjectStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import GridComponent from '../components/Grid';

export default function CombinerBoxPlacement() {
  const navigate = useNavigate();
  const { 
    combinerBoxes, 
    addCombinerBox, 
    removeCombinerBox,
    selectedCombinerBox, 
    setSelectedCombinerBox,
    panels 
  } = useProjectStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedCombinerBox) {
        removeCombinerBox(selectedCombinerBox);
        setSelectedCombinerBox(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCombinerBox, removeCombinerBox, setSelectedCombinerBox]);

  const handleGridClick = (x: number, y: number) => {
    // Snap to half-grid increments
    const snappedX = Math.round(x * 2) / 2;
    const snappedY = Math.round(y * 2) / 2;

    // Check if we clicked on an existing combiner box
    const clickedBox = combinerBoxes.find(box => {
      return Math.abs(box.x - snappedX) < 0.25 && Math.abs(box.y - snappedY) < 0.25;
    });

    if (clickedBox) {
      setSelectedCombinerBox(clickedBox.id);
      return;
    }

    // Check if the new position would overlap with existing boxes
    const overlaps = combinerBoxes.some(box => {
      return Math.abs(box.x - snappedX) < 0.5 && Math.abs(box.y - snappedY) < 0.5;
    });

    if (overlaps) {
      setError('Combiner box would overlap with an existing box');
      return;
    }

    // Check if the new position would overlap with any panels
    const panelOverlap = panels.some(panel => {
      const panelRight = panel.x + (panel.orientation === 'landscape' ? 4 : 2);
      const panelBottom = panel.y + (panel.orientation === 'landscape' ? 2 : 4);
      return snappedX >= panel.x && snappedX < panelRight && snappedY >= panel.y && snappedY < panelBottom;
    });

    if (panelOverlap) {
      setError('Combiner box cannot be placed on top of a panel');
      return;
    }

    setError('');
    addCombinerBox({
      id: uuidv4(),
      x: snappedX,
      y: snappedY,
    });
  };

  const handleNext = () => {
    if (combinerBoxes.length === 0) {
      setError('Please place at least one combiner box before proceeding');
      return;
    }
    navigate('/strings');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Combiner Box Placement
        </Typography>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={combinerBoxes.length === 0}
        >
          Next: Define Strings
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '33%' }, flexShrink: 0 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1. Click anywhere on the grid to place a combiner box
                <br />
                2. Combiner boxes will snap to half-grid increments
                <br />
                3. Click on an existing box to select it
                <br />
                4. Press Delete or Backspace to remove the selected box
                <br />
                5. Combiner boxes cannot be placed on top of panels
              </Typography>
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '67%' }, flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Not drawn to scale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Note: Each grid cell represents 6" spacing. Combiner boxes will snap to half-grid increments (3").
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'auto' }}>
              <GridComponent 
                orientation="portrait"
                showPreview={true}
                showCombinerBoxes={true}
                placementMode={true}
                onCombinerBoxPlace={(box) => {
                  addCombinerBox(box);
                }}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 