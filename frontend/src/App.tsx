import { GlobalStyles } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { AppRoutes } from './routes/AppRoutes';
import { cssVariables, theme } from "./styles/theme";
import './styles/global.scss';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MuiThemeProvider theme={theme}>
          <GlobalStyles styles={{ ":root": cssVariables }} />
          <BudgetProvider>
            <AppRoutes />
          </BudgetProvider>
        </MuiThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
