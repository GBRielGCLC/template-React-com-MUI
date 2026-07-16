import { LocalizationProvider } from '@mui/x-date-pickers';
import { PersonalizedToast } from './Components/PersonalizedToast';
import { AppThemeProvider, ConfirmDialogProvider } from './Contexts';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import "dayjs/locale/pt";
import { ptBR } from "@mui/x-date-pickers/locales";
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { Login } from './Pages/Login';
import { AppRoutes } from './Routes';
import { BrowserRouter } from 'react-router-dom';
import { GenericLayout } from './Components/GenericLayout';
import { ArrayTelasModulos } from './Pages/Home/ArrayTelas';

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <GenericLayout menuItems={ArrayTelasModulos()} appName="Template Base">
      <AppRoutes />
    </GenericLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="pt"
          localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <AppThemeProvider>
            <ConfirmDialogProvider>
              <PersonalizedToast />
              <AppContent />
            </ConfirmDialogProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
