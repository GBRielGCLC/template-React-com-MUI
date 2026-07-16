import { Settings as SettingsIcon } from '@mui/icons-material';
import { Exemplo } from '../Exemplo';
import { MenuItem } from '../../Components/GenericLayout';

export const ArrayTelasModulos = (): MenuItem[] => [
    {
        titulo: 'Exemplo',
        icone: <SettingsIcon />,
        path: '/home/exemplo',
        element: <Exemplo />,
    },
];

export const ArrayTelas = (): MenuItem[] => [
    ...ArrayTelasModulos(),
];
