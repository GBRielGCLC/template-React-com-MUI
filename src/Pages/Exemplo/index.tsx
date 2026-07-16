import { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    Grid,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem as MuiMenuItem,
    Select,
    Switch,
    Checkbox,
    RadioGroup,
    Radio,
    Autocomplete,
    Stack,
    Chip,
    IconButton,
    Tooltip,
    Paper,
    InputAdornment,
} from '@mui/material';
import { DatePicker, DateTimePicker, MobileDatePicker, MobileTimePicker } from '@mui/x-date-pickers';
import { Controller } from 'react-hook-form';
import {
    Send,
    Notifications,
    CheckCircle,
    Error,
    Warning,
    Info,
    Refresh,
    Edit,
    Delete,
    ContentCopy,
    FormatQuote,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useConfirm } from '../../Contexts/ConfirmDialogContext';
import { toastManager } from '../../Services/ToastUtils';
import { formatarMoeda, formatarNumero, formatarDataTela } from '../../Services/Formatters';
import { PersonalizedDataGrid } from '../../Components/PersonalizedDataGrid';
import { withDefaultColumns } from '../../Services/PersonalizedDataGrid';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { ActionButtons } from '../../Components/PersonalizedDataGrid/ActionButtons';
import { useExemplo } from './useExemplo';

const columns: GridColDef[] = withDefaultColumns([
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nome', headerName: 'Nome', minWidth: 150 },
    { field: 'email', headerName: 'E-mail', minWidth: 200 },
    {
        field: 'valor',
        headerName: 'Valor',
        minWidth: 120,
        renderCell: (params: GridRenderCellParams) => formatarMoeda(params.value),
    },
    {
        field: 'data',
        headerName: 'Data',
        minWidth: 120,
        renderCell: (params: GridRenderCellParams) => formatarDataTela(params.value),
    },
    {
        field: 'status',
        headerName: 'Status',
        minWidth: 120,
        renderCell: (params: GridRenderCellParams) => (
            <Chip
                label={params.value}
                color={params.value === 'Ativo' ? 'success' : params.value === 'Pendente' ? 'warning' : 'error'}
                size="small"
            />
        ),
    },
    {
        field: 'actions',
        headerName: 'Ações',
        minWidth: 100,
        type: 'actions',
        renderCell: (params: GridRenderCellParams) => (
            <ActionButtons
                params={params}
                onEdit={(row) => toastManager.info(`Editando: ${row.nome}`)}
                onDelete={(row) => toastManager.warn(`Excluindo: ${row.nome}`)}
            />
        ),
    },
]);

const sampleRows = [
    { id: 1, nome: 'João Silva', email: 'joao@email.com', valor: 1500.50, data: '2025-03-15', status: 'Ativo' },
    { id: 2, nome: 'Maria Santos', email: 'maria@email.com', valor: 2300.00, data: '2025-04-20', status: 'Pendente' },
    { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', valor: 890.75, data: '2025-05-10', status: 'Inativo' },
    { id: 4, nome: 'Ana Costa', email: 'ana@email.com', valor: 4200.00, data: '2025-06-01', status: 'Ativo' },
    { id: 5, nome: 'Lucas Ferreira', email: 'lucas@email.com', valor: 1750.25, data: '2025-07-12', status: 'Ativo' },
];

const opcoesAutocomplete = [
    'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js',
];

export const Exemplo = () => {
    const { control, handleSubmit, errors, isLoading, onSubmit, reset, watch } = useExemplo();
    const confirm = useConfirm();
    const [gridRows, setGridRows] = useState(sampleRows);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 3 }}>
            <Typography variant="h4" fontWeight="bold">
                Demonstração de Componentes
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Esta página demonstra todas as bibliotecas instaladas no template.
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card>
                        <CardHeader
                            title="Formulário Completo"
                            subheader="react-hook-form + Yup + MUI"
                            avatar={<Send color="primary" />}
                        />
                        <CardContent>
                            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="nome"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Nome"
                                                    fullWidth
                                                    error={!!errors.nome}
                                                    helperText={errors.nome?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="E-mail"
                                                    type="email"
                                                    fullWidth
                                                    error={!!errors.email}
                                                    helperText={errors.email?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="senha"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Senha"
                                                    type={showPassword ? 'text' : 'password'}
                                                    fullWidth
                                                    error={!!errors.senha}
                                                    helperText={errors.senha?.message}
                                                    slotProps={{
                                                        input: {
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <IconButton
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        edge="end"
                                                                        size="small"
                                                                    >
                                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                                    </IconButton>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="numero"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Número Inteiro"
                                                    type="number"
                                                    fullWidth
                                                    value={field.value ?? ''}
                                                    error={!!errors.numero}
                                                    helperText={errors.numero?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="valor"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Valor Monetário"
                                                    type="number"
                                                    fullWidth
                                                    slotProps={{ htmlInput: { step: 0.01 } }}
                                                    value={field.value ?? ''}
                                                    error={!!errors.valor}
                                                    helperText={errors.valor?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="select"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth error={!!errors.select}>
                                                    <InputLabel>Selecione</InputLabel>
                                                    <Select
                                                        {...field}
                                                        label="Selecione"
                                                    >
                                                        <MuiMenuItem value="opcao1">Opção 1</MuiMenuItem>
                                                        <MuiMenuItem value="opcao2">Opção 2</MuiMenuItem>
                                                        <MuiMenuItem value="opcao3">Opção 3</MuiMenuItem>
                                                    </Select>
                                                    {errors.select && (
                                                        <FormHelperText>{errors.select.message}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="data"
                                            control={control}
                                            render={({ field }) => (
                                                <DatePicker
                                                    label="Data"
                                                    value={field.value}
                                                    onChange={(newValue) => field.onChange(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.data,
                                                            helperText: errors.data?.message,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="dataHora"
                                            control={control}
                                            render={({ field }) => (
                                                <DateTimePicker
                                                    label="Data e Hora"
                                                    value={field.value}
                                                    onChange={(newValue) => field.onChange(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.dataHora,
                                                            helperText: errors.dataHora?.message,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="data"
                                            control={control}
                                            render={({ field }) => (
                                                <MobileDatePicker
                                                    label="Data (Mobile)"
                                                    value={field.value}
                                                    onChange={(newValue) => field.onChange(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.data,
                                                            helperText: errors.data?.message,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="dataHora"
                                            control={control}
                                            render={({ field }) => (
                                                <MobileTimePicker
                                                    label="Horário (Mobile)"
                                                    value={field.value}
                                                    onChange={(newValue) => field.onChange(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.dataHora,
                                                            helperText: errors.dataHora?.message,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="autocomplete"
                                            control={control}
                                            render={({ field }) => (
                                                <Autocomplete
                                                    {...field}
                                                    options={opcoesAutocomplete}
                                                    onChange={(_, value) => field.onChange(value ?? '')}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label="Autocomplete"
                                                            error={!!errors.autocomplete}
                                                            helperText={errors.autocomplete?.message}
                                                        />
                                                    )}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Controller
                                            name="multiline"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Texto Longo"
                                                    multiline
                                                    rows={3}
                                                    fullWidth
                                                    error={!!errors.multiline}
                                                    helperText={errors.multiline?.message}
                                                />
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name="switchAtivo"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl error={!!errors.switchAtivo}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={field.value}
                                                                onChange={field.onChange}
                                                                color="primary"
                                                            />
                                                        }
                                                        label="Ativo"
                                                    />
                                                    {errors.switchAtivo && (
                                                        <FormHelperText>{errors.switchAtivo.message}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name="checkbox"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl error={!!errors.checkbox}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={field.value}
                                                                onChange={field.onChange}
                                                                color="primary"
                                                            />
                                                        }
                                                        label="Concordo"
                                                    />
                                                    {errors.checkbox && (
                                                        <FormHelperText>{errors.checkbox.message}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Controller
                                            name="radio"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl error={!!errors.radio}>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        Prioridade
                                                    </Typography>
                                                    <RadioGroup
                                                        {...field}
                                                        row
                                                    >
                                                        <FormControlLabel value="baixa" control={<Radio size="small" />} label="Baixa" />
                                                        <FormControlLabel value="alta" control={<Radio size="small" />} label="Alta" />
                                                    </RadioGroup>
                                                    {errors.radio && (
                                                        <FormHelperText>{errors.radio.message}</FormHelperText>
                                                    )}
                                                </FormControl>
                                            )}
                                        />
                                    </Grid>
                                </Grid>

                                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<Send />}
                                        disabled={isLoading}
                                    >
                                        Enviar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={() => reset()}
                                        disabled={isLoading}
                                    >
                                        Limpar
                                    </Button>
                                </Stack>

                                {watch('nome') && (
                                    <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Valor em tempo real: <strong>{watch('nome')}</strong>
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Stack spacing={3}>
                        <Card>
                            <CardHeader
                                title="Notificações Toast"
                                subheader="react-toastify com toastManager"
                                avatar={<Notifications color="primary" />}
                            />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Sistema de notificações com deduplicação automática.
                                    Clique duas vezes para ver o efeito de atualização.
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Tooltip title="Toast de sucesso">
                                        <IconButton
                                            color="success"
                                            onClick={() => toastManager.success('Operação realizada com sucesso!')}
                                        >
                                            <CheckCircle />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toast de erro">
                                        <IconButton
                                            color="error"
                                            onClick={() => toastManager.error('Ocorreu um erro inesperado!')}
                                        >
                                            <Error />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toast de aviso">
                                        <IconButton
                                            color="warning"
                                            onClick={() => toastManager.warn('Atenção: dados não salvos!')}
                                        >
                                            <Warning />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toast informativo">
                                        <IconButton
                                            color="info"
                                            onClick={() => toastManager.info('Nova atualização disponível.')}
                                        >
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader
                                title="Diálogo de Confirmação"
                                subheader="ConfirmDialogContext global"
                                avatar={<FormatQuote color="primary" />}
                            />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Diálogo global com controle de loading e callback assíncrono.
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<CheckCircle />}
                                        onClick={() =>
                                            confirm({
                                                titulo: 'Confirmar ação?',
                                                conteudo: 'Tem certeza que deseja prosseguir com esta operação?',
                                                onConfirm: async ({ close, setLoading }) => {
                                                    setLoading(true);
                                                    await new Promise((r) => setTimeout(r, 1500));
                                                    toastManager.success('Ação confirmada com sucesso!');
                                                    close();
                                                },
                                            })
                                        }
                                    >
                                        Confirmar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<Delete />}
                                        onClick={() =>
                                            confirm({
                                                titulo: 'Excluir registro?',
                                                conteudo: 'Esta ação não pode ser desfeita. Deseja continuar?',
                                                textBtnConfirmar: 'Excluir',
                                                corBtnConfirmar: 'error',
                                                onConfirm: async ({ close, setLoading }) => {
                                                    setLoading(true);
                                                    await new Promise((r) => setTimeout(r, 1000));
                                                    toastManager.success('Registro excluído!');
                                                    close();
                                                },
                                            })
                                        }
                                    >
                                        Excluir
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader
                                title="Formatadores"
                                subheader="Moeda, Número e Data"
                                avatar={<ContentCopy color="primary" />}
                            />
                            <CardContent>
                                <Stack spacing={1.5}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">Moeda (BRL):</Typography>
                                        <Chip label={formatarMoeda(1500.50)} color="primary" variant="outlined" />
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">Número:</Typography>
                                        <Chip label={formatarNumero(1234567.89)} color="primary" variant="outlined" />
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">Data:</Typography>
                                        <Chip label={formatarDataTela('2025-07-16T14:30:00')} color="primary" variant="outlined" />
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">Data (null):</Typography>
                                        <Chip label={formatarDataTela(null)} color="default" variant="outlined" />
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader
                                title="Ações de Grid"
                                subheader="Botões de Editar e Excluir"
                                avatar={<Edit color="primary" />}
                            />
                            <CardContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Use os botões de ação na tabela abaixo para testar.
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        startIcon={<Refresh />}
                                        onClick={() => setGridRows(sampleRows)}
                                    >
                                        Restaurar Dados
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardHeader
                            title="DataGrid Personalizado"
                            subheader="@mui/x-data-grid com toolbar customizada, paginação e ações"
                            avatar={<Edit color="primary" />}
                        />
                        <CardContent sx={{ p: 0 }}>
                            <PersonalizedDataGrid
                                tableId="exemplo-grid"
                                rows={gridRows}
                                columns={columns}
                                paginationMode="client"
                                loading={isLoading}
                                onRefresh={() => {
                                    setGridRows(sampleRows);
                                    toastManager.success('Dados atualizados!');
                                }}
                                autoHeight
                                sx={{ minHeight: 300 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};
