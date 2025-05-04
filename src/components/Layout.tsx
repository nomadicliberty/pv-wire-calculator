import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useProjectStore } from '../store';

const steps = [
  { label: 'Panel Placement', path: '/' },
  { label: 'Combiner Box', path: '/combiner-box' },
  { label: 'String Definition', path: '/strings' },
  { label: 'Wire Calculation', path: '/wire-calculation' },
];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const reset = useProjectStore(state => state.reset);
  const currentStep = steps.findIndex(step => step.path === location.pathname);

  const handleNewProject = () => {
    reset();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100vw' }}>
      <AppBar position="static" sx={{ width: '100vw' }}>
        <Toolbar sx={{ width: '100vw', maxWidth: '100%', px: 3 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PV Wire Calculator
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleNewProject}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            New Project
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: '100vw', bgcolor: 'background.paper', boxShadow: 1 }}>
        <Stepper activeStep={currentStep} sx={{ p: 3, maxWidth: '100vw', overflowX: 'auto' }}>
          {steps.map((step) => (
            <Step key={step.path}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100vw', minHeight: 0, height: '100%' }}>
        {children}
      </Box>
    </Box>
  );
} 