import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useProjectStore } from '../store';
import GridComponent from '../components/Grid';

const CELL_SIZE = 25; // pixels, should match Grid component

export default function WireCalculation() {
  const navigate = useNavigate();
  const { strings, panels, combinerBoxes, saveProject, measurementSystem, panelWidth, panelLength, panelSpacing, rowSpacing } = useProjectStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');

  // Helper to convert metric to inches if needed
  const toInches = (value: number) => measurementSystem === 'metric' ? value / 2.54 : value;

  // Get real-world panel and gap sizes in inches
  const realPanelWidth = toInches(Number(panelWidth) || 0);
  const realPanelLength = toInches(Number(panelLength) || 0);
  const realPanelGap = toInches(Number(panelSpacing) || 0);
  const realRowGap = toInches(Number(rowSpacing) || 0);

  // Calculate real-world position of a panel terminal (match grid logic and use polarity)
  const getPanelTerminalPosition = (panel: any, side: 'left' | 'right' | 'top' | 'bottom') => {
    const width = toInches(Number(panel.width));
    const length = toInches(Number(panel.length));
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
    return { x, y };
  };

  // Combiner box bottom center in inches
  const getCombinerBoxPosition = (box: any) => {
    const x = box.x + box.width / 2;
    const y = box.y + box.height;
    return { x, y };
  };

  // Manhattan distance in inches, vertical first then horizontal
  const manhattanVH = (x1: number, y1: number, x2: number, y2: number) => Math.abs(y2 - y1) + Math.abs(x2 - x1);

  const calculateWireLength = (stringId: string) => {
    const string = strings.find(s => s.id === stringId);
    if (!string) return { positive: "0 ft", negative: "0 ft", total: "0 ft" };

    // Get all panels in the string
    const stringPanels = string.panels
      .map(panelId => panels.find(p => p.id === panelId))
      .filter((panel): panel is NonNullable<typeof panel> => panel !== undefined);

    if (stringPanels.length === 0) return { positive: "0 ft", negative: "0 ft", total: "0 ft" };

    // Get the combiner box
    const combinerBox = combinerBoxes.find(box => box.id === string.combinerBoxId);
    if (!combinerBox) return { positive: "0 ft", negative: "0 ft", total: "0 ft" };

    // Positive wire: from positive terminal of first panel to combiner box
    const firstPanel = stringPanels[0];
    const firstPanelPos = getPanelTerminalPosition(firstPanel, firstPanel.polarity.positive);
    const combinerPos = getCombinerBoxPosition(combinerBox);
    const positiveLength = manhattanVH(firstPanelPos.x, firstPanelPos.y, combinerPos.x, combinerPos.y);

    // Negative wire: from negative terminal of last panel to combiner box
    const lastPanel = stringPanels[stringPanels.length - 1];
    const lastPanelPos = getPanelTerminalPosition(lastPanel, lastPanel.polarity.negative);
    const negativeLength = manhattanVH(lastPanelPos.x, lastPanelPos.y, combinerPos.x, combinerPos.y);

    // Convert to feet (1 foot = 12 inches)
    const positiveFeet = (positiveLength / 12).toFixed(2);
    const negativeFeet = (negativeLength / 12).toFixed(2);
    const totalFeet = ((positiveLength + negativeLength) / 12).toFixed(2);

    return {
      positive: `${positiveFeet} ft`,
      negative: `${negativeFeet} ft`,
      total: `${totalFeet} ft`
    };
  };

  const handleSaveClick = () => {
    setSaveDialogOpen(true);
  };

  const handleSaveConfirm = () => {
    if (!projectName.trim()) {
      setProjectNameError('Please enter a project name');
      return;
    }
    saveProject(projectName.trim());
    setSaveDialogOpen(false);
    setProjectName('');
    setProjectNameError('');
  };

  const handleSaveCancel = () => {
    setSaveDialogOpen(false);
    setProjectName('');
    setProjectNameError('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Wire Calculation
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/strings')}
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
          <Button variant="contained" color="primary" onClick={handleSaveClick}>
            Save Project
          </Button>
        </Box>
      </Box>

      {/* Save Project Dialog */}
      <Dialog open={saveDialogOpen} onClose={handleSaveCancel}>
        <DialogTitle>Save Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setProjectNameError('');
            }}
            error={!!projectNameError}
            helperText={projectNameError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveCancel}>Cancel</Button>
          <Button onClick={handleSaveConfirm} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Wire Lengths
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>String</TableCell>
                <TableCell>Positive Wire Length</TableCell>
                <TableCell>Negative Wire Length</TableCell>
                <TableCell>Total Wire Length</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {strings.map((string) => {
                const stringPanels = string.panels.map(panelId => 
                  panels.find(p => p.id === panelId)
                ).filter((p): p is NonNullable<typeof p> => p !== undefined);
                
                const combinerBox = combinerBoxes.find(b => b.id === string.combinerBoxId);
                if (!combinerBox) return null;

                const positiveWireLength = calculateWireLength(string.id).positive;
                const negativeWireLength = calculateWireLength(string.id).negative;
                const totalWireLength = calculateWireLength(string.id).total;

                return (
                  <TableRow key={string.id}>
                    <TableCell>String {string.number}</TableCell>
                    <TableCell>{positiveWireLength}</TableCell>
                    <TableCell>{negativeWireLength}</TableCell>
                    <TableCell>{totalWireLength}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, height: '600px', position: 'relative', mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          Not drawn to scale
        </Typography>
        <GridComponent 
          orientation="portrait"
          showPreview={false}
          applySpacing={true}
          panels={panels}
          showCombinerBoxes={true}
          placementMode={false}
          strings={strings}
        />
      </Paper>
    </Box>
  );
} 