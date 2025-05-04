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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
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

      <Stepper activeStep={currentStep} sx={{ p: 3 }}>
        {steps.map((step) => (
          <Step key={step.path}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
} 