import { LocalizationProvider } from '@mui/x-date-pickers';
import { PersonalizedToast } from './Components/PersonalizedToast';
import { AppThemeProvider, ConfirmDialogProvider } from './Contexts';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import "dayjs/locale/pt";
import { ptBR } from "@mui/x-date-pickers/locales";
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import { Login } from './Pages/Login';
import { AppRoutes } from './Routes';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { GenericLayout, MenuItem } from './Components/GenericLayout';
import { Event as EventIcon, AdminPanelSettings } from '@mui/icons-material';

const baseMenuItems: MenuItem[] = [
  {
    titulo: 'Eventos',
    icone: <EventIcon />,
    path: '/events',
  },
];

/** Rotas que funcionam sem login e sem o shell (sidebar/appbar). */
const isStandalonePath = (pathname: string) =>
  pathname === '/join' || pathname === '/invite' || pathname.startsWith('/public/');

const AppContent = () => {
  const { isAuthenticated, isParticipant, participantEventId, user } = useAuth();
  const location = useLocation();

  // Link público do evento, entrada do participante e aceite de convite:
  // sem login e sem layout.
  if (isStandalonePath(location.pathname)) {
    return <AppRoutes />;
  }

  if (!isAuthenticated && !isParticipant) {
    return <Login />;
  }

  // Participante (sem usuário logado) não lista eventos — menu é só o dele.
  const menuItems: MenuItem[] = isAuthenticated
    ? [
        ...baseMenuItems,
        // Só quem tem `platform_admin` vê a administração da plataforma.
        ...(user?.isPlatformAdmin
          ? [
              {
                titulo: 'Administração',
                icone: <AdminPanelSettings />,
                path: '/admin',
              },
            ]
          : []),
      ]
    : [
        {
          titulo: 'Meu evento',
          icone: <EventIcon />,
          path: participantEventId ? `/events/${participantEventId}` : '/events',
        },
      ];

  return (
    <GenericLayout menuItems={menuItems} appName="Quitta">
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
