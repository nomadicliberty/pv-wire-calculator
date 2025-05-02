import { useState } from 'react';
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
    if (currentString.panels.length > 0) {
      setCurrentString(prev => ({
        ...prev,
        combinerBoxId: boxId
      }));
    }
  };

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
      id: crypto.randomUUID(),
      panels: currentString.panels,
      combinerBoxId: currentString.combinerBoxId,
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
  };

  // Helper function to format panel IDs
  const formatPanelId = (id: string) => {
    return `P${id.slice(0, 4)}`;
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
        <Button
          variant="contained"
          onClick={handleNext}
        >
          Next: Wire Calculation
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

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              String #{currentStringNumber}
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Panels" 
                  secondary={
                    currentString.panels.length > 0 
                      ? currentString.panels.map(formatPanelId).join(' → ')
                      : 'No panels selected'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Combiner Box" 
                  secondary={currentString.combinerBoxId ? `Box ${currentString.combinerBoxId.slice(0, 4)}` : 'Not connected'}
                />
              </ListItem>
            </List>
            <Button
              variant="contained"
              fullWidth
              onClick={handleCreateString}
              disabled={currentString.panels.length < 2 || !currentString.combinerBoxId}
            >
              Create String #{currentStringNumber}
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Defined Strings
            </Typography>
            <List>
              {strings.map((string, index) => (
                <ListItem
                  key={string.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeString(string.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`String ${index + 1}`}
                    secondary={`${string.panels.map(formatPanelId).join(' → ')} → Box ${string.combinerBoxId.slice(0, 4)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '67%' }, flexGrow: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Not drawn to scale
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isSelectingFirstPanel 
                ? 'Select the first panel of your string (this will be the positive end)'
                : 'Select the next panel in your string or click "Create String" to finish'}
            </Typography>
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