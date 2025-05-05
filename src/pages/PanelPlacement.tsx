import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Stack,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Popover,
} from '@mui/material';
import { useProjectStore } from '../store';
import GridComponent from '../components/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import { Panel } from '../types';
import { applyPanelSpacing } from '../utils/panelSpacing';

export default function PanelPlacement() {
  const navigate = useNavigate();
  const {
    measurementSystem, 
    setMeasurementSystem,
    panels,
    addPanel,
    updatePanel,
    removePanel,
    selectedPanel,
    setSelectedPanel,
    loadProject,
    setPanelWidth,
    setPanelLength,
    setPanelSpacing,
    setRowSpacing,
    panelWidth,
    panelLength,
    panelSpacing,
    rowSpacing
  } = useProjectStore();
  const nextPanelNumber = useProjectStore(state => state.nextPanelNumber);

  
  const [error, setError] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [mode, setMode] = useState<'place' | 'select'>('place');
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const [isPolarityFlipped, setIsPolarityFlipped] = useState(false);

  // Reset local state when panels array changes (indicating a project reset)
  useEffect(() => {
    if (panels.length === 0) {
      setPanelWidth('');
      setPanelLength('');
      setOrientation('portrait');
      setMode('place');
      setRowSpacing('0.5');
      setPanelSpacing('0.5');
      setIsPolarityFlipped(false);
      setError('');
    }
  }, [panels, setPanelWidth, setPanelLength, setRowSpacing, setPanelSpacing]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Backspace' || event.key === 'Delete') && selectedPanel) {
        removePanel(selectedPanel);
        setSelectedPanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPanel, removePanel, setSelectedPanel]);

  const handleGridClick = (gridPosition) => { // Rename the argument to be more descriptive
    // Set rotation and polarity based on isPolarityFlipped
    const polarityMap = {
      0: { positive: 'left' as const, negative: 'right' as const },
      180: { positive: 'right' as const, negative: 'left' as const }
    };
    const rotation = isPolarityFlipped ? 180 : 0;
    const polarity = polarityMap[rotation as 0 | 180];

    addPanel({
      x: gridPosition.x, // Use the x from the grid click
      y: gridPosition.y, // Use the y from the grid click
      orientation: orientation, // Use the current orientation from state
      width: Number(panelWidth), // Use the current width from state (ensure it's a number)
      length: Number(panelLength), // Use the current length from state (ensure it's a number)
      rotation: rotation,
      polarity: polarity
    });
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (!selectedPanel) return;
    const panel = panels.find(p => p.id === selectedPanel);
    if (!panel) return;

    // Calculate new rotation based on direction (90 degrees)
    const currentRotation = panel.rotation || 0;
    const rotationChange = direction === 'left' ? -90 : 90;
    const newRotation = (currentRotation + rotationChange + 360) % 360;

    // Calculate new dimensions after rotation
    const isLandscape = panel.orientation === 'landscape';
    const newWidth = isLandscape ? 2 : 4;
    const newLength = isLandscape ? 4 : 2;

    // Calculate new polarity based on rotation
    const polarityMap = {
      0: { positive: 'left' as const, negative: 'right' as const },
      90: { positive: 'top' as const, negative: 'bottom' as const },
      180: { positive: 'right' as const, negative: 'left' as const },
      270: { positive: 'bottom' as const, negative: 'top' as const }
    };

    // Check if the rotated panel would overlap with other panels
    const overlaps = panels.some(otherPanel => {
      if (otherPanel.id === panel.id) return false;

      const panelRight = panel.x + newWidth;
      const panelBottom = panel.y + newLength;
      const otherPanelRight = otherPanel.x + (otherPanel.orientation === 'landscape' ? 4 : 2);
      const otherPanelBottom = otherPanel.y + (otherPanel.orientation === 'landscape' ? 2 : 4);

      // Check for any overlap
      return !(panelRight <= otherPanel.x || panel.x >= otherPanelRight || 
               panelBottom <= otherPanel.y || panel.y >= otherPanelBottom);
    });

    if (overlaps) {
      setError('Rotation would cause panel overlap');
      return;
    }

    // Check if the rotated panel would be out of bounds
    if (panel.x + newWidth > 50 || panel.y + newLength > 50) {
      setError('Rotation would place panel outside the grid');
      return;
    }

    setError('');
    updatePanel(selectedPanel, {
      rotation: newRotation as 0 | 90 | 180 | 270,
      orientation: isLandscape ? 'portrait' : 'landscape',
      polarity: polarityMap[newRotation as keyof typeof polarityMap]
    });
  };

  const handleFlip = () => {
    if (mode === 'place') {
      setIsPolarityFlipped(!isPolarityFlipped);
      return;
    }

    if (selectedPanel) {
      const panel = panels.find(p => p.id === selectedPanel);
      if (!panel) return;
      // Toggle between 0 and 180 rotation, just like in place mode
      const newRotation = panel.rotation === 180 ? 0 : 180;
      const polarityMap = {
        0: { positive: 'left' as const, negative: 'right' as const },
        180: { positive: 'right' as const, negative: 'left' as const }
      };
      const newPolarity = polarityMap[newRotation as 0 | 180];
      updatePanel(selectedPanel, {
        rotation: newRotation as 0 | 180,
        polarity: newPolarity
      });
      setSelectedPanel(null); // Force deselect
      setTimeout(() => setSelectedPanel(selectedPanel), 0); // Force reselect after update
    }
  };

  // Get the current polarity state
  const getCurrentPolarity = () => {
    if (mode === 'select' && selectedPanel) {
      const panel = panels.find(p => p.id === selectedPanel);
      if (panel && panel.polarity) {
        // Only handle portrait for now (left/right)
        return {
          left: panel.polarity.positive === 'left' ? '+' : '-',
          right: panel.polarity.positive === 'right' ? '+' : '-'
        };
      }
    }
    // Place mode or no panel selected
    return {
      left: isPolarityFlipped ? '-' : '+',
      right: isPolarityFlipped ? '+' : '-'
    };
  };

  const polarity = getCurrentPolarity();

  // Update polarity when selecting a panel
  useEffect(() => {
    if (mode === 'select' && selectedPanel) {
      const panel = panels.find(p => p.id === selectedPanel);
      if (panel) {
        setIsPolarityFlipped(panel.rotation === 180);
      }
    } else if (mode === 'place') {
      // Keep the current polarity state in place mode
    }
  }, [selectedPanel, panels, mode]);

  const handleNext = () => {
    if (panels.length === 0) {
      setError('Please place at least one panel before proceeding');
      return;
    }
    navigate('/combiner-box');
  };
  

  const handleInfoOpen = (event: React.MouseEvent<HTMLElement>) => {
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  const handleLoadProject = async () => {
    try {
      await loadProject();
    } catch (error) {
      console.error('Failed to load project:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', flexGrow: 1, minHeight: 0, height: '100%', position: 'relative' }}>
      {/* Controls column */}
      <Box sx={{ width: 520, minWidth: 520, flexShrink: 0, p: 2, bgcolor: 'background.paper', borderRight: 1, borderColor: 'grey.200', overflowY: 'auto', zIndex: 2, position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4">
              Panel Placement
            </Typography>
            <IconButton
              size="small"
              onClick={handleInfoOpen}
              sx={{ color: 'text.secondary' }}
            >
              <InfoIcon />
            </IconButton>
            <Popover
              open={infoOpen}
              anchorEl={infoAnchorEl}
              onClose={handleInfoClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Box sx={{ p: 2, maxWidth: 300 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Instructions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {mode === 'place' ? (
                    <>
                      1. Enter panel dimensions
                      <br />
                      2. Select panel orientation
                      <br />
                      3. Click on the grid to place a panel
                      <br />
                      4. Switch to "Select Panels" mode to modify panels
                    </>
                  ) : (
                    <>
                      1. Click on a panel to select it
                      <br />
                      2. Use the controls to flip the selected panel
                      <br />
                      3. Press Delete or Backspace to remove the selected panel
                      <br />
                      4. Switch to "Place Panels" mode to add more panels
                    </>
                  )}
                </Typography>
              </Box>
            </Popover>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleLoadProject}
            >
              Load Project
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={panels.length === 0}
            >
              Next: Combiner Box
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 2, mb: 1 }}>
          <Stack spacing={1}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5 }}>
                Mode
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, newMode) => {
                  if (newMode !== null) {
                    setMode(newMode);
                    setSelectedPanel(null);
                  }
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="place">
                  <AddIcon sx={{ mr: 0.5 }} />
                  Place
                </ToggleButton>
                <ToggleButton value="select">
                  <EditIcon sx={{ mr: 0.5 }} />
                  Select
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {mode === 'place' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5 }}>
                  Panel Dimensions
                </Typography>
                <Stack spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Width (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
                    value={panelWidth}
                    onChange={(e) => {
                      setPanelWidth(e.target.value);
                      setError('');
                    }}
                    type="number"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={`Length (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
                    value={panelLength}
                    onChange={(e) => {
                      setPanelLength(e.target.value);
                      setError('');
                    }}
                    type="number"
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Portrait
                      </Typography>
                      <Box
                        sx={{
                          width: 16,
                          height: 24,
                          border: '1px solid',
                          borderColor: 'text.secondary',
                          backgroundColor: orientation === 'portrait' ? 'primary.light' : 'transparent',
                        }}
                      />
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={orientation === 'landscape'}
                          onChange={(e) => {
                            setOrientation(e.target.checked ? 'landscape' : 'portrait');
                            setError('');
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Landscape
                          </Typography>
                          <Box
                            sx={{
                              width: 24,
                              height: 16,
                              border: '1px solid',
                              borderColor: 'text.secondary',
                              backgroundColor: orientation === 'landscape' ? 'primary.light' : 'transparent',
                            }}
                          />
                        </Box>
                      }
                    />
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={measurementSystem === 'metric'}
                        onChange={(e) => {
                          setMeasurementSystem(e.target.checked ? 'metric' : 'imperial');
                          setError('');
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Use Metric
                      </Typography>
                    }
                  />
                </Stack>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5 }}>
                Spacing
              </Typography>
              <Stack spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label={`Row (${measurementSystem === 'imperial' ? 'in' : 'mm'})`}
                  value={rowSpacing}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRowSpacing(value);
                  }}
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={`Panel (${measurementSystem === 'imperial' ? 'in' : 'mm'})`}
                  value={panelSpacing}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPanelSpacing(value);
                  }}
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 0.5 }}>
                Panel Controls
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {'Click the button to rotate the panel 180°'}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    onClick={handleFlip} 
                    title="Flip Polarity"
                    disabled={mode === 'select' && !selectedPanel}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: 40,
                      height: 60,
                      border: '1px solid',
                      borderRadius: '4px',
                      borderColor: 'text.secondary',
                      backgroundColor: isPolarityFlipped ? 'action.selected' : 'transparent',
                      '&:hover': {
                        backgroundColor: isPolarityFlipped ? 'action.selected' : 'action.hover',
                      },
                      px: 1,
                      py: 1
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {polarity.left}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {polarity.right}
                    </Typography>
                  </IconButton>
                </Stack>
                {selectedPanel && mode === 'select' && (
                  <Typography variant="body2" color="text.secondary">
                    Press Delete/Backspace to remove
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
      {/* Grid column */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, p: 0, position: 'relative', zIndex: 1 }}>
        <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', m: 0, p: 0, height: '100%', width: '100%', boxShadow: 'none', borderRadius: 0, bgcolor: 'background.default', overflow: 'hidden' }}>
          <Box sx={{ width: '100%', px: 3, pt: 2, pb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Not drawn to scale
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Note: Each grid cell represents 12" spacing. When panels or rows are placed with gaps, the calculator will add the appropriate spacing for wire length calculations.
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 0, minWidth: 0, p: 0, overflow: 'hidden' }}>
          <GridComponent
  orientation={orientation}
  showPreview={true}
  showCombinerBoxes={false}
  applySpacing={false}
  onPanelPlace={(panel) => {
    addPanel({ ...panel, number: nextPanelNumber });
  }}
  placementMode={mode === 'place' && panelWidth !== '' && panelLength !== ''}
  isPolarityFlipped={isPolarityFlipped}
  onPanelSelect={panel => setSelectedPanel(panel.id)}
  selectedPanels={selectedPanel ? new Set([selectedPanel]) : new Set()}
/>

          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 