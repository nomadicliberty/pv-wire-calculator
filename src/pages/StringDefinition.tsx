import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GridComponent from '../components/Grid';
import { useProjectStore } from '../store';
import { Panel, String } from '../types';

export default function StringDefinition() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { 
    panels, 
    combinerBoxes, 
    strings, 
    addString, 
    removeString,
    selectedPanel,
    setSelectedPanel,
    selectedCombinerBox,
    setSelectedCombinerBox
  } = useProjectStore();

  const [currentString, setCurrentString] = useState<{
    panels: string[];
    combinerBoxId: string | null;
  }>({
    panels: [],
    combinerBoxId: null
  });

  const [isSelectingFirstPanel, setIsSelectingFirstPanel] = useState(true);
  const [currentStringNumber, setCurrentStringNumber] = useState(1);
  const [selectedPanels, setSelectedPanels] = useState<Set<string>>(new Set());

  const handlePanelSelect = (panel: Panel) => {
    if (isSelectingFirstPanel) {
      // Starting a new string with this panel
      setCurrentString({
        panels: [panel.id],
        combinerBoxId: null
      });
      setSelectedPanels(new Set([panel.id]));
      setIsSelectingFirstPanel(false);
    } else if (currentString.panels.length > 0) {
      // Adding to existing string
      if (!currentString.panels.includes(panel.id)) {
        setCurrentString(prev => ({
          ...prev,
          panels: [...prev.panels, panel.id]
        }));
        setSelectedPanels(prev => new Set([...prev, panel.id]));
      }
    }
  };

  const handleCombinerBoxSelect = (boxId: string) => {
    console.log('Combiner box selected:', boxId);
    setCurrentString(prev => ({
      ...prev,
      combinerBoxId: boxId
    }));
  };

  // Add useEffect to monitor state changes
  useEffect(() => {
    console.log('Current string state:', {
      panels: currentString.panels,
      combinerBoxId: currentString.combinerBoxId,
      panelCount: currentString.panels.length,
      hasCombinerBox: !!currentString.combinerBoxId
    });
  }, [currentString]);

  const handleCreateString = () => {
    if (currentString.panels.length < 2) {
      setError('Please select at least two panels for the string');
      return;
    }
    if (!currentString.combinerBoxId) {
      setError('Please select a combiner box for the string');
      return;
    }

    addString({
      panels: currentString.panels,
      combinerBoxId: currentString.combinerBoxId,
      number: currentStringNumber,
      wirePath: {
        positive: [],
        negative: []
      }
    });

    setCurrentString({
      panels: [],
      combinerBoxId: null
    });
    setSelectedPanels(new Set());
    setIsSelectingFirstPanel(true);
    setCurrentStringNumber(prev => prev + 1);
    setError('');
    setSelectedCombinerBox(null); // Reset combiner box selection
  };

  // Helper function to get panel number
  const getPanelNumber = (panelId: string) => {
    const panel = panels.find(p => p.id === panelId);
    return panel ? panel.number : '?';
  };

  const handleNext = () => {
    if (strings.length === 0) {
      setError('Please create at least one string before proceeding');
      return;
    }
    navigate('/wire-calculation');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          String Definition
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/combiner-box')}
            sx={{ 
              borderColor: 'grey.400',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'grey.600',
                backgroundColor: 'action.hover'
              }
            }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={strings.length === 0}
          >
            Next: Wire Calculation
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" gutterBottom>
                Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                1. Click on the first panel of your string (this will be the positive end)
                <br />
                2. Click on subsequent panels in order to add them to the string
                <br />
                3. Click on a combiner box to connect the string
                <br />
                4. Click "Create String" to save the string
                <br />
                5. Repeat for all strings in your system
              </Typography>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              String #{currentStringNumber}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Panels" 
                  secondary={
                    currentString.panels.length > 0 
                      ? currentString.panels.map(getPanelNumber).join(' → ')
                      : 'No panels selected'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Combiner Box" 
                  secondary={currentString.combinerBoxId ? 'Connected' : 'Not connected'}
                />
              </ListItem>
            </List>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreateString}
              disabled={currentString.panels.length < 2 || !currentString.combinerBoxId}
              sx={{ mt: 1 }}
            >
              Create String #{currentStringNumber}
            </Button>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Defined Strings
            </Typography>
            <List dense>
              {strings.map((string, index) => (
                <ListItem
                  key={string.id}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => removeString(string.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`String ${index + 1}`}
                    secondary={`Panel ${string.panels.map(getPanelNumber).join(' → ')} → Box ${string.combinerBoxId.slice(0, 4)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '70%' }, flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ p: 2, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
              Not drawn to scale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {isSelectingFirstPanel 
                ? 'Select the first panel of your string (this will be the positive end)'
                : 'Select the next panel in your string or click "Create String" to finish'}
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 0, 
                  borderTop: '2px dashed #4caf50'
                }} />
                <Typography variant="caption">Positive Wire</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 20, 
                  height: 0, 
                  borderTop: '2px dashed #f44336'
                }} />
                <Typography variant="caption">Negative Wire</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'auto' }}>
              <GridComponent 
                orientation="portrait"
                showPreview={false}
                showCombinerBoxes={true}
                placementMode={false}
                onPanelSelect={handlePanelSelect}
                onCombinerBoxSelect={handleCombinerBoxSelect}
                selectedPanels={selectedPanels}
              />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 