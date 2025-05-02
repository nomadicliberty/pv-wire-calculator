import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import PanelPlacement from './pages/PanelPlacement';
import CombinerBoxPlacement from './pages/CombinerBoxPlacement';
import StringDefinition from './pages/StringDefinition';
import WireCalculation from './pages/WireCalculation';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<PanelPlacement />} />
            <Route path="/combiner-box" element={<CombinerBoxPlacement />} />
            <Route path="/strings" element={<StringDefinition />} />
            <Route path="/wire-calculation" element={<WireCalculation />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
