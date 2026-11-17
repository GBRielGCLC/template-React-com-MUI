import { Delete, Edit, MoreVert } from '@mui/icons-material';
import { GridActionsCellItem, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Descrição de uma ação da coluna "Ações".
 * Use este formato em arquivos .tsx (o ícone é JSX) e chame a função dentro do renderCell.
 */
export interface ActionButtonDescriptor {
    /** Rótulo do botão (aria-label) e texto exibido no menu de ações. */
    label: string;
    icon: React.ReactElement;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    /** Texto do tooltip. Quando ausente, usa o `label`. */
    tooltip?: string;
    disabled?: boolean;
    /** Quando true, a ação nunca aparece como ícone: vai direto para o menu de ações. */
    showInMenu?: boolean;
}

export interface ActionButtonsProps<T> extends React.PropsWithChildren {
    params: GridRenderCellParams<any, T>;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    /** Ações extras da célula (além de editar/excluir). */
    actions?: ActionButtonDescriptor[];
}

const ICON_FONT_SIZE = 20;
const BUTTON_GAP = 4;
const FALLBACK_BUTTON_WIDTH = 32;

/**
 * Converte os filhos em `ActionButtonDescriptor[]`.
 * Aceita `GridActionsCellItem`, `React.Fragment` e `Tooltip` envolvendo os itens
 * (formato legado), achatando tudo em uma lista simples.
 */
const collectActions = (node: React.ReactNode, target: ActionButtonDescriptor[]): void => {
    React.Children.forEach(node, (child) => {
        if (!React.isValidElement(child)) {
            return;
        }

        if (child.type === React.Fragment) {
            collectActions((child.props as { children?: React.ReactNode }).children, target);
            return;
        }

        if (child.type === Tooltip) {
            const { title, children: tooltipChildren } = child.props as {
                title?: React.ReactNode;
                children?: React.ReactNode;
            };
            const previousLength = target.length;

            collectActions(tooltipChildren, target);

            if (typeof title === 'string') {
                for (let index = previousLength; index < target.length; index++) {
                    if (!target[index].tooltip) {
                        target[index].tooltip = title;
                    }
                }
            }
            return;
        }

        if (child.type === GridActionsCellItem) {
            const { label, icon, onClick, disabled, showInMenu } = child.props as {
                label?: string;
                icon?: React.ReactElement;
                onClick?: (event: React.MouseEvent<HTMLElement>) => void;
                disabled?: boolean;
                showInMenu?: boolean;
            };

            if (label && icon) {
                target.push({ label, icon, onClick, disabled, showInMenu });
            }
        }
    });
};

const ActionIconButton = ({ action }: { action: ActionButtonDescriptor }) => {
    const button = (
        <IconButton
            size="small"
            aria-label={action.label}
            disabled={action.disabled}
            sx={{ flexShrink: 0 }}
            onClick={(event) => {
                event.stopPropagation();
                action.onClick?.(event);
            }}
        >
            {action.icon}
        </IconButton>
    );

    const title = action.tooltip ?? action.label;

    return title ? (
        <Tooltip title={title} arrow>
            {button}
        </Tooltip>
    ) : (
        button
    );
};

interface ResponsiveActionsProps {
    actions: ActionButtonDescriptor[];
}

/**
 * Renderiza as ações dentro da célula respeitando a largura disponível:
 * enquanto couber, mostra todos os ícones; quando não couber, move os excedentes
 * para o menu do botão "⋮".
 */
const ResponsiveActions = ({ actions }: ResponsiveActionsProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [capacity, setCapacity] = useState<number | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

    const recalculate = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const available = container.clientWidth;
        if (!available) {
            return;
        }

        const sample = container.querySelector('button');
        const buttonWidth = sample?.getBoundingClientRect().width || FALLBACK_BUTTON_WIDTH;
        const fits = Math.max(1, Math.floor((available + BUTTON_GAP) / (buttonWidth + BUTTON_GAP)));

        setCapacity((current) => (current === fits ? current : fits));
    }, []);

    useLayoutEffect(() => {
        recalculate();

        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(() => recalculate());
        observer.observe(container);

        return () => observer.disconnect();
    }, [recalculate]);

    const inlineActions = actions.filter((action) => !action.showInMenu);
    const menuOnlyActions = actions.filter((action) => action.showInMenu);
    const hasOverflow = capacity !== null && inlineActions.length > capacity;
    const showMenuButton = hasOverflow || menuOnlyActions.length > 0;

    const maxInline = capacity === null
        ? inlineActions.length
        : showMenuButton
            ? Math.max(0, capacity - 1)
            : inlineActions.length;

    const visibleInline = inlineActions.slice(0, maxInline);
    const menuActions = [...inlineActions.slice(maxInline), ...menuOnlyActions];

    return (
        <Box
            ref={containerRef}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${BUTTON_GAP}px`,
                width: '100%',
                overflow: 'hidden',
                '& .MuiSvgIcon-root': { fontSize: ICON_FONT_SIZE },
            }}
        >
            {visibleInline.map((action, index) => (
                <ActionIconButton key={`${action.label}-${index}`} action={action} />
            ))}

            {showMenuButton && (
                <>
                    <Tooltip title="Mais ações" arrow>
                        <IconButton
                            size="small"
                            aria-label="Mais ações"
                            aria-haspopup="menu"
                            sx={{ flexShrink: 0 }}
                            onClick={(event) => {
                                event.stopPropagation();
                                setMenuAnchor(event.currentTarget);
                            }}
                        >
                            <MoreVert color="action" />
                        </IconButton>
                    </Tooltip>

                    <Menu
                        anchorEl={menuAnchor}
                        open={!!menuAnchor}
                        onClose={() => setMenuAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        slotProps={{ paper: { sx: { minWidth: 180 } } }}
                    >
                        {menuActions.map((action, index) => (
                            <MenuItem
                                key={`${action.label}-${index}`}
                                disabled={action.disabled}
                                onClick={(event) => {
                                    setMenuAnchor(null);
                                    action.onClick?.(event);
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32, '& .MuiSvgIcon-root': { fontSize: ICON_FONT_SIZE } }}>
                                    {action.icon}
                                </ListItemIcon>
                                <ListItemText>{action.label}</ListItemText>
                            </MenuItem>
                        ))}
                    </Menu>
                </>
            )}
        </Box>
    );
};

export const ActionButtons = <T,>({
    params,
    onEdit,
    onDelete,
    actions: extraActions,
    children,
}: ActionButtonsProps<T>) => {
    const row = params.row;
    const actions: ActionButtonDescriptor[] = [];

    if (onEdit) {
        actions.push({
            label: 'Editar',
            icon: <Edit color="success" />,
            onClick: () => onEdit(row),
        });
    }

    if (onDelete) {
        actions.push({
            label: 'Deletar',
            icon: <Delete color="error" />,
            onClick: () => onDelete(row),
        });
    }

    if (extraActions?.length) {
        actions.push(...extraActions);
    }

    collectActions(children, actions);

    if (!actions.length) {
        return null;
    }

    return <ResponsiveActions actions={actions} />;
};
