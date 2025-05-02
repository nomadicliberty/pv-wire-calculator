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
  Slider,
  FormControl,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Tooltip,
  Popover,
} from '@mui/material';
import { useProjectStore } from '../store';
import GridComponent from '../components/Grid';
import { v4 as uuidv4 } from 'uuid';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import FlipIcon from '@mui/icons-material/Flip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import { Panel } from '../types';

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
  } = useProjectStore();
  
  const [panelWidth, setPanelWidth] = useState('');
  const [panelLength, setPanelLength] = useState('');
  const [error, setError] = useState('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [mode, setMode] = useState<'place' | 'select'>('place');
  const [rowSpacing, setRowSpacing] = useState(0.5);
  const [panelSpacing, setPanelSpacing] = useState(0.5);
  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);

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

  const handleGridClick = (panel: Panel) => {
    addPanel(panel);
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
    });
  };

  const handleFlip = () => {
    if (!selectedPanel) return;
    const panel = panels.find(p => p.id === selectedPanel);
    if (!panel) return;

    // Toggle between 0 and 180 degrees
    const newRotation = panel.rotation === 180 ? 0 : 180;

    // No need to check for collisions since we're just flipping in place
    setError('');
    updatePanel(selectedPanel, {
      rotation: newRotation as 0 | 90 | 180 | 270,
      orientation: panel.orientation
    });
  };

  // Get the current polarity state for the selected panel
  const getCurrentPolarity = () => {
    if (!selectedPanel) return { left: '+', right: '-' };
    const panel = panels.find(p => p.id === selectedPanel);
    if (!panel) return { left: '+', right: '-' };
    const isFlipped = panel.rotation === 180;
    return {
      left: isFlipped ? '-' : '+',
      right: isFlipped ? '+' : '-'
    };
  };

  const polarity = getCurrentPolarity();

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

  return (
    <Box>
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
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={panels.length === 0}
        >
          Next: Place Combiner Box
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '33%' }, flexShrink: 0 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
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
                    <AddIcon sx={{ mr: 1 }} />
                    Place Panels
                  </ToggleButton>
                  <ToggleButton value="select">
                    <EditIcon sx={{ mr: 1 }} />
                    Select Panels
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {mode === 'place' && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Panel Dimensions
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Panel Width (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
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
                      label={`Panel Length (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
                      value={panelLength}
                      onChange={(e) => {
                        setPanelLength(e.target.value);
                        setError('');
                      }}
                      type="number"
                      inputProps={{ min: 0, step: 0.1 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Portrait
                        </Typography>
                        <Box
                          sx={{
                            width: 20,
                            height: 30,
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              Landscape
                            </Typography>
                            <Box
                              sx={{
                                width: 30,
                                height: 20,
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
                      label="Use Metric Measurements"
                    />
                  </Stack>
                </Box>
              )}

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Spacing Settings
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Row Spacing (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
                    value={rowSpacing}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setRowSpacing(value);
                      }
                    }}
                    type="number"
                    inputProps={{ min: 0, step: 0.1 }}
                    helperText="Default: 0.5 inches"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label={`Panel Spacing (${measurementSystem === 'imperial' ? 'inches' : 'mm'})`}
                    value={panelSpacing}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0) {
                        setPanelSpacing(value);
                      }
                    }}
                    type="number"
                    inputProps={{ min: 0, step: 0.1 }}
                    helperText="Default: 0.5 inches"
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Panel Controls
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    {mode === 'select' 
                      ? (selectedPanel 
                        ? 'Use these controls to adjust the selected panel:' 
                        : 'Select a panel to adjust its orientation')
                      : 'Switch to "Select Panels" mode to modify existing panels'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton 
                      onClick={handleFlip} 
                      title="Flip Polarity"
                      disabled={!selectedPanel || mode !== 'select'}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: 40,
                        height: 40,
                        border: '1px solid',
                        borderColor: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">{polarity.left}</Typography>
                      <Typography variant="body2" color="text.secondary">{polarity.right}</Typography>
                    </IconButton>
                  </Stack>
                  {selectedPanel && mode === 'select' && (
                    <Typography variant="body2" color="text.secondary">
                      Press Delete or Backspace to remove the selected panel
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '67%' }, flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Not drawn to scale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Note: Each grid cell represents 6" spacing. When panels or rows are placed with gaps, the calculator will add the appropriate spacing for wire length calculations.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'auto' }}>
              <GridComponent 
                orientation={orientation}
                showPreview={true}
                showCombinerBoxes={false}
                onPanelPlace={handleGridClick}
                placementMode={mode === 'place' && panelWidth !== '' && panelLength !== ''}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 