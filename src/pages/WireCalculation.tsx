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

const CELL_SIZE = 20; // pixels, should match Grid component

export default function WireCalculation() {
  const navigate = useNavigate();
  const { strings, panels, combinerBoxes, saveProject } = useProjectStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectNameError, setProjectNameError] = useState('');

  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    // Calculate Manhattan distance (grid-based path)
    const horizontalDistance = Math.abs(x2 - x1);
    const verticalDistance = Math.abs(y2 - y1);
    return horizontalDistance + verticalDistance;
  };

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

    // Calculate positive wire length (from first panel to combiner box)
    const firstPanel = stringPanels[0];
    const positiveLength = calculateDistance(
      firstPanel.x,
      firstPanel.y,
      combinerBox.x,
      combinerBox.y
    );

    // Calculate negative wire length (from last panel to combiner box)
    const lastPanel = stringPanels[stringPanels.length - 1];
    const negativeLength = calculateDistance(
      lastPanel.x,
      lastPanel.y,
      combinerBox.x,
      combinerBox.y
    );

    // Convert to feet (assuming each grid cell is 6 inches)
    const positiveFeet = (positiveLength * 0.5).toFixed(1);
    const negativeFeet = (negativeLength * 0.5).toFixed(1);
    const totalFeet = ((positiveLength + negativeLength) * 0.5).toFixed(1);

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

                const positiveWireLength = calculateDistance(
                  stringPanels[0].x,
                  stringPanels[0].y,
                  combinerBox.x,
                  combinerBox.y
                );
                const negativeWireLength = calculateDistance(
                  stringPanels[stringPanels.length - 1].x,
                  stringPanels[stringPanels.length - 1].y,
                  combinerBox.x,
                  combinerBox.y
                );
                const totalWireLength = positiveWireLength + negativeWireLength;

                return (
                  <TableRow key={string.id}>
                    <TableCell>String {string.number}</TableCell>
                    <TableCell>{positiveWireLength.toFixed(1)} ft</TableCell>
                    <TableCell>{negativeWireLength.toFixed(1)} ft</TableCell>
                    <TableCell>{totalWireLength.toFixed(1)} ft</TableCell>
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
          showCombinerBoxes={true}
          placementMode={false}
          panelOutlineColor="grey.300"
          showStrings={true}
          showWirePaths={true}
        />
      </Paper>
    </Box>
  );
} 