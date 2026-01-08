import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router } from 'react-router-dom'; // 👈 импортируем BrowserRouter
import { theme } from './styles/theme';
import './styles/global.css';
import AppRoutes from './routes/AppRoutes'; // 👈 переименовываем

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router> {/* 👈 добавляем BrowserRouter */}
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;