import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import {
    Box,
    List,
    Divider,
    IconButton,
    Typography,
    Tooltip,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CssBaseline,
    Toolbar,
    Collapse,
    SvgIconProps,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import {
    Menu as MenuIcon,
    Logout,
    ExpandLess,
    ExpandMore,
    Home as HomeIcon,
    MenuOpen,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import { ToggleThemeButton } from '../ToggleThemeButton';

export interface MenuItem {
    titulo: string;
    icone: React.ReactNode;
    path?: string;
    url?: string;
    element?: React.ReactNode;
    allowedRoles?: string[];
    desabilitado?: boolean;
    mensagemDesabilitado?: string;
    telas?: MenuItem[];
}

interface GenericLayoutProps {
    children: React.ReactNode;
    menuItems?: MenuItem[];
    appName?: string;
}

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer)(
    ({ theme, open }) => {
        const paperScrollbar = {
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.mode === 'light' ? grey[300] : grey[700],
                borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: theme.palette.mode === 'light' ? grey[400] : grey[600],
            },
            scrollbarWidth: 'thin' as const,
            scrollbarColor: theme.palette.mode === 'light'
                ? `${grey[300]} transparent`
                : `${grey[600]} transparent`,
        };

        return {
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            ...(open && {
                ...openedMixin(theme),
                '& .MuiDrawer-paper': { ...openedMixin(theme), ...paperScrollbar },
            }),
            ...(!open && {
                ...closedMixin(theme),
                '& .MuiDrawer-paper': { ...closedMixin(theme), ...paperScrollbar },
            }),
        };
    },
);

export const GenericLayout: React.FC<GenericLayoutProps> = ({
    children,
    menuItems = [],
    appName = 'TEMPLATE BASE',
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [open, setOpen] = React.useState(() => {
        const savedState = localStorage.getItem('menu-drawer-open');
        return savedState !== null ? JSON.parse(savedState) : true;
    });

    const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const drawerOpen = isMobile ? true : open;

    React.useEffect(() => {
        localStorage.setItem('menu-drawer-open', JSON.stringify(open));
    }, [open]);

    const activeItem = menuItems.find(item =>
        item.path && location.pathname.includes(item.path)
    );

    React.useEffect(() => {
        document.title = activeItem?.titulo ?? appName;
    }, [activeItem, location.pathname, appName]);

    const renderMenuItem = (item: MenuItem) => {
        const hasSubtelas = item.telas && item.telas.length > 0;
        const isOpen = openMenus[item.titulo];
        const isActive = item.path ? location.pathname.includes(item.path) : false;

        return (
            <Box key={item.titulo} sx={{ mb: 0.5 }}>
                <ListItem
                    disablePadding
                    sx={{ display: 'block' }}
                    secondaryAction={
                        drawerOpen && hasSubtelas && !item.desabilitado && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenus((prev) => ({ ...prev, [item.titulo]: !prev[item.titulo] }));
                                }}
                                sx={{ mr: 0.5 }}
                            >
                                {isOpen ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        )
                    }
                >
                    <Tooltip title={item.desabilitado ? item.mensagemDesabilitado ?? 'Módulo desabilitado' : (!drawerOpen ? item.titulo : '')} placement="right">
                        <ListItemButton
                            onClick={() => {
                                if (item.desabilitado) {
                                    if (item.path) navigate(item.path);
                                    if (isMobile) setMobileOpen(false);
                                    return;
                                }
                                if (item.url) {
                                    window.open(item.url, '_blank');
                                } else if (item.path) {
                                    navigate(item.path);
                                }
                                if (isMobile) setMobileOpen(false);
                            }}
                            selected={isActive}
                            sx={{
                                minHeight: 44,
                                justifyContent: drawerOpen ? 'initial' : 'center',
                                px: 2.5,
                                borderRadius: 2,
                                pr: drawerOpen && hasSubtelas ? 6 : 2.5,
                                backgroundColor: isActive && !isOpen ? 'action.selected' : 'transparent',
                                color: isActive ? 'primary.main' : 'inherit',
                                opacity: item.desabilitado ? 0.4 : 1,
                            }}
                        >
                            <ListItemIcon sx={{
                                minWidth: 0,
                                mr: drawerOpen ? 2 : 'auto',
                                justifyContent: 'center',
                                color: 'inherit',
                                '& svg': { fontSize: 22 }
                            }}>
                                {React.isValidElement<SvgIconProps>(item.icone) ? React.cloneElement(item.icone) : item.icone}
                            </ListItemIcon>

                            <ListItemText
                                primary={item.titulo}
                                sx={{ opacity: drawerOpen ? 1 : 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                primaryTypographyProps={{ fontWeight: isActive ? 600 : 400, noWrap: true, fontSize: '0.875rem' }}
                            />
                        </ListItemButton>
                    </Tooltip>
                </ListItem>

                {hasSubtelas && !item.desabilitado && (
                    <Collapse in={isOpen && drawerOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ mt: 0.5 }}>
                            {item.telas?.map((sub) => {
                                const prefixo = item.path?.replace(/\/[^/]*$/, '') ?? '';
                                const fullPath = `${prefixo}${sub.path}`;
                                const isSubActive = location.pathname === fullPath;

                                return (
                                    <Tooltip key={sub.path} title={sub.desabilitado ? sub.mensagemDesabilitado ?? 'Módulo desabilitado' : ''} placement="right">
                                        <ListItemButton
                                            disabled={sub.desabilitado}
                                            onClick={() => {
                                                if (sub.desabilitado) return;
                                                if (sub.url) {
                                                    window.open(sub.url, '_blank');
                                                } else {
                                                    navigate(fullPath);
                                                }
                                                if (isMobile) setMobileOpen(false);
                                            }}
                                            sx={{
                                                minHeight: 36,
                                                pl: 4,
                                                borderRadius: 2,
                                                mx: 1,
                                                mb: 0.2,
                                                backgroundColor: isSubActive ? 'primary.light' : 'transparent',
                                                color: isSubActive ? 'primary.contrastText' : 'text.secondary',
                                                opacity: sub.desabilitado ? 0.4 : 1,
                                                '&:hover': { backgroundColor: isSubActive ? 'primary.main' : 'action.hover' }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 0, mr: 2, color: 'inherit', '& svg': { fontSize: 18 } }}>
                                                {sub.icone}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={sub.titulo}
                                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isSubActive ? 600 : 400, noWrap: true }}
                                            />
                                        </ListItemButton>
                                    </Tooltip>
                                );
                            })}
                        </List>
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            <AppBar position="fixed" open={isMobile ? false : open} color="inherit" elevation={1}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
                        <IconButton
                            color="inherit"
                            onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setOpen(!open)}
                            edge="start"
                            sx={{
                                marginRight: 2,
                                transition: 'transform 0.3s ease',
                                transform: open ? 'rotate(0deg)' : 'rotate(180deg)'
                            }}
                        >
                            {open ? <MenuOpen /> : <MenuIcon />}
                        </IconButton>
                    </Box>

                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            gap: 1.5,
                            zIndex: 1
                        }}
                    >
                        <Typography
                            variant="h2"
                            color="primary"
                            fontWeight="bold"
                            sx={{ textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}
                        >
                            {activeItem?.titulo ?? appName}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, zIndex: 2 }}>
                        <Tooltip title="Trocar Tema">
                            <ToggleThemeButton />
                        </Tooltip>

                        <Tooltip title="Sair">
                            <IconButton color="error" onClick={logout} size="small">
                                <Logout />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer variant={isMobile ? 'temporary' : 'permanent'} open={isMobile ? mobileOpen : open} onClose={isMobile ? () => setMobileOpen(false) : undefined}>
                <DrawerHeader sx={{ justifyContent: 'center', py: 2 }}>
                    <Typography
                        variant="h6"
                        color="primary"
                        fontWeight="bold"
                        sx={{
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                        }}
                        onClick={() => navigate('/home')}
                    >
                        {appName}
                    </Typography>
                </DrawerHeader>
                <Divider />

                <List sx={{ px: 1, pt: 0.5 }}>
                    <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                        <Tooltip title={!drawerOpen ? "Página Inicial" : ""} placement="right">
                            <ListItemButton
                                onClick={() => {
                                    navigate('/home');
                                    if (isMobile) setMobileOpen(false);
                                }}
                                selected={location.pathname === '/home'}
                                sx={{
                                    minHeight: 44,
                                    justifyContent: drawerOpen ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: 2,
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 0, mr: drawerOpen ? 2 : 'auto', justifyContent: 'center' }}>
                                    <HomeIcon fontSize="small" color={location.pathname === '/home' ? "primary" : "inherit"} />
                                </ListItemIcon>
                                <ListItemText primary="Página Inicial" sx={{ opacity: drawerOpen ? 1 : 0 }} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>

                    <Divider sx={{ my: 1 }} />

                    {menuItems.map(renderMenuItem)}
                </List>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, px: 3, pt: 3, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 0px)' }}>
                <DrawerHeader />
                <Box sx={{ flex: 1 }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};
