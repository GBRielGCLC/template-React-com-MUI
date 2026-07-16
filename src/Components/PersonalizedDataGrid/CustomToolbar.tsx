import {
    GridToolbarContainer,
    ColumnsPanelTrigger,
    ToolbarButton,
} from '@mui/x-data-grid';
import { Box, Divider, keyframes, Tooltip } from '@mui/material';
import { ReactNode } from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';
import { FilterAlt, ViewColumn } from '@mui/icons-material';

interface CustomToolbarProps {
    isLoading: boolean;
    onRefresh?: () => void;
    onClickFilter?: () => void;
    leftContent?: ReactNode;
}

export const CustomToolbar = ({ onRefresh, isLoading, onClickFilter, leftContent }: CustomToolbarProps) => {
    const spin = keyframes`
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    `;

    return (
        <GridToolbarContainer sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
        }}>
            {leftContent && (
                <Box
                    sx={{
                        mr: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    {leftContent}
                </Box>
            )}

            <Tooltip title="Colunas">
                <ColumnsPanelTrigger render={<ToolbarButton />}>
                    <ViewColumn fontSize="small" />
                </ColumnsPanelTrigger>
            </Tooltip>

            {(onClickFilter || onRefresh) && <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />}

            {onClickFilter && <Tooltip title="Filtro">
                <ToolbarButton onClick={onClickFilter}>
                    <FilterAlt fontSize="small" />
                </ToolbarButton>
            </Tooltip>}

            {onRefresh && <Tooltip title="Recarregar">
                <span>
                    <ToolbarButton
                        onClick={onRefresh}
                        disabled={isLoading}

                    >
                        <RefreshIcon
                            fontSize="small"
                            sx={{
                                animation: isLoading
                                    ? `${spin} 0.8s linear infinite`
                                    : 'none',
                                transition: 'transform 0.3s ease',
                            }}
                        />
                    </ToolbarButton>
                </span>
            </Tooltip>}

        </GridToolbarContainer>
    );
};
