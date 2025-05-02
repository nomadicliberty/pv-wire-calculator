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
} from '@mui/material';
import { useProjectStore } from '../store';

export default function WireCalculation() {
  const navigate = useNavigate();
  const { strings, panels, combinerBoxes } = useProjectStore();

  const calculateWireLength = (stringId: string) => {
    // TODO: Implement actual wire length calculation based on panel positions and paths
    return {
      positive: "0 ft",
      negative: "0 ft",
      total: "0 ft"
    };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Wire Calculation
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Wire Lengths and Paths
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>String ID</TableCell>
                <TableCell>Panels</TableCell>
                <TableCell>Combiner Box</TableCell>
                <TableCell>Positive Wire Length</TableCell>
                <TableCell>Negative Wire Length</TableCell>
                <TableCell>Total Wire Length</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {strings.map((string) => {
                const wireLengths = calculateWireLength(string.id);
                return (
                  <TableRow key={string.id}>
                    <TableCell>{string.id}</TableCell>
                    <TableCell>{string.panels.length} panels</TableCell>
                    <TableCell>{string.combinerBoxId}</TableCell>
                    <TableCell>{wireLengths.positive}</TableCell>
                    <TableCell>{wireLengths.negative}</TableCell>
                    <TableCell>{wireLengths.total}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/strings')}
        >
          Back: String Definition
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
        >
          Start New Project
        </Button>
      </Box>
    </Box>
  );
} 