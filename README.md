# Template Base MUI

Template base para projetos React com Material UI (MUI), incluindo autenticação, temas, formulários e componentes personalizados.

## Bibliotecas Principais

### UI e Componentes
- **@mui/material** (v7.3.9) - Biblioteca de componentes Material UI
- **@mui/icons-material** (v7.3.9) - Ícones Material UI
- **@mui/x-data-grid** (v8.28.1) - Componente de grade de dados
- **@mui/x-date-pickers** (v8.27.2) - Seletores de data/hora
- **@emotion/react** (v11.14.0) - Motor de estilos CSS-in-JS
- **@emotion/styled** (v11.14.1) - Estilização de componentes

### Estado e Formulários
- **react-hook-form** (v7.72.0) - Gerenciamento de formulários
- **@hookform/resolvers** (v5.2.2) - Resolvers para validação de formulários
- **yup** (v1.7.1) - Validação de esquemas

### Navegação e HTTP
- **react-router-dom** (v7.14.2) - Roteamento de páginas
- **axios** (v1.13.6) - Cliente HTTP

### Utilitários
- **dayjs** (v1.11.20) - Manipulação de datas
- **react-toastify** (v11.0.5) - Notificações toast

### Testes
- **@testing-library/react** (v16.3.2) - Testes de componentes React
- **@testing-library/jest-dom** (v6.9.1) - Matchers de dom para testes
- **@testing-library/user-event** (v13.5.0) - Simulação de eventos de usuário
- **@testing-library/dom** (v10.4.1) - Utilitários de DOM para testes

### Tipagem
- **typescript** (v4.9.5) - TypeScript para tipagem estática
- **@types/react** (v19.2.14) - Tipos para React
- **@types/react-dom** (v19.2.3) - Tipos para React DOM
- **@types/jest** (v27.5.2) - Tipos para Jest
- **@types/node** (v16.18.126) - Tipos para Node.js

## Comandos

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm start
```

### Build para Produção
```bash
npm run build
```

### Testes
```bash
npm test
```

### Remover Bibliotecas
Para remover uma biblioteca específica, utilize o comando:
```bash
npm uninstall <nome-da-biblioteca>
```

Exemplos:
```bash
# Remover uma biblioteca individual
npm uninstall react-toastify

# Remover múltiplas bibliotecas
npm uninstall @mui/x-date-pickers dayjs

# Remover bibliotecas de desenvolvimento
npm uninstall @testing-library/react @testing-library/jest-dom
```

## Estrutura do Projeto

```
src/
├── Components/         # Componentes reutilizáveis
│   ├── BarraColorida.tsx
│   ├── ConfirmDialog/
│   ├── GenericLayout/
│   ├── PersonalizedDataGrid/
│   ├── PersonalizedToast/
│   └── ToggleThemeButton/
├── Contexts/           # Contextos React
│   ├── AuthContext.tsx
│   ├── ConfirmDialogContext.tsx
│   └── ThemeContext.tsx
├── Pages/              # Páginas da aplicação
│   ├── AccessDenied/
│   ├── Home/
│   ├── Login/
│   └── NotFound/
├── Routes/             # Configuração de rotas
├── Services/           # Serviços e utilitários
│   ├── Api/            # Configuração de API com Axios
│   ├── Formatters/     # Formatadores
│   ├── PersonalizedDataGrid/
│   ├── ToastUtils.ts
│   └── Yup/            # Configuração de validação
├── Themes/             # Configuração de temas
│   ├── Dark.ts
│   ├── Light.ts
│   └── Base.ts
├── Utils/              # Utilitários gerais
├── App.tsx
└── index.tsx
```

## Funcionalidades

- ✅ Tema claro e escuro com alternância
- ✅ Autenticação básica com contexto
- ✅ Formulários com validação (Yup + React Hook Form)
- ✅ Componente de grade de dados personalizado
- ✅ Notificações toast
- ✅ Roteamento com proteção de páginas
- ✅ Configuração de API com interceptors
- ✅ Diálogo de confirmação global
- ✅ Layout genérico para páginas

---

## Personalização do Tema

O sistema de temas fica na pasta `src/Themes/` e é composto por 3 arquivos:

```
src/Themes/
├── Base.ts     # Estilos compartilhados entre light e dark
├── Light.ts    # Tema claro
├── Dark.ts     # Tema escuro
└── index.ts    # Exporta os temas
```

### Alterando as cores do tema

#### Tema Claro (`src/Themes/Light.ts`)

```typescript
export const LightTheme = createTheme(getBaseTheme('light'), {
    palette: {
        primary: {
            main: "#083c94",      // ← Cor principal (azul escuro)
            dark: blue[600],      // ← Variação escura
            light: blue[400],     // ← Variação clara
            contrastText: '#ffffff',
        },
        secondary: {
            main: cyan[700],      // ← Cor secundária (ciano)
            dark: cyan[800],
            light: cyan[600],
            contrastText: '#ffffff',
        },
        background: {
            paper: '#f9f9f9',     // ← Fundo de cards/modais
            default: grey[200],   // ← Fundo da página
        },
        text: {
            secondary: grey[700], // ← Cor de textos secundários
        }
    },
});
```

#### Tema Escuro (`src/Themes/Dark.ts`)

```typescript
export const DarkTheme = createTheme(getBaseTheme('dark'), {
    palette: {
        primary: {
            main: "#0075a3",      // ← Cor principal (azul petróleo)
            dark: blue[700],
            light: "#00aeea",
            contrastText: '#ffffff',
        },
        secondary: {
            main: cyan[400],      // ← Cor secundária (ciano mais claro)
            dark: cyan[300],
            light: cyan[200],
            contrastText: '#000000',
        },
        background: {
            paper: '#1c1c1c',     // ← Fundo de cards/modais
            default: '#121212',   // ← Fundo da página
        },
        text: {
            primary: '#ffffff',
            secondary: grey[400],
        },
        divider: '#2f3330',      // ← Cor de divisórias
    },
});
```

### Alterando o Base Theme (`src/Themes/Base.ts`)

O Base Theme contém estilos que são aplicados em **ambos** os temas (light e dark):

```typescript
export const getBaseTheme = (mode: 'light' | 'dark'): ThemeOptions => ({
    // Tipografia - altere fontes e tamanhos
    typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',  // ← Fonte global
        h1: { fontSize: '2rem', fontWeight: 500 },
        h2: { fontSize: '1.5rem', fontWeight: 500 },
        h3: { fontSize: '1.25rem', fontWeight: 500 },
        h4: { fontSize: '1rem', fontWeight: 500 },
    },

    // Formato dos cantos - aumente para mais arredondado
    shape: {
        borderRadius: 12,  // ← Raio da borda global
    },

    // Estilos de componentes específicos
    components: {
        // Cor do CircularProgress (loading)
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: blue[600],  // ← Cor do spinner
                },
            },
        },

        // Cor do asterisco de campo obrigatório
        MuiFormLabel: {
            styleOverrides: {
                asterisk: {
                    color: '#d32f2f',  // ← Vermelho
                },
            },
        },

        // Estilo dos botões
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',   // ← Sem uppercase automático
                    fontWeight: 500,
                    borderRadius: 12,        // ← Mesmo raio do tema
                },
            },
        },

        // Estilo dos cards
        MuiCard: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(12px)',  // ← Efeito de vidro fosco
                },
            },
        },
    },
});
```

### Alterando o estilo da DataGrid

Tanto o tema Light quanto o Dark possuem estilos customizados para a DataGrid. Para modificar:

```typescript
// Dentro de Light.ts ou Dark.ts
components: {
    MuiDataGrid: {
        styleOverrides: {
            root: {
                backgroundColor: '#ffffff',           // ← Fundo da tabela
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 8,
            },
            columnHeader: {
                background: '#0D47A1',               // ← Cor do cabeçalho
                color: '#ffffff',
                fontWeight: 'bold',
            },
            row: {
                '&:nth-of-type(odd)': {
                    backgroundColor: '#ffffff',       // ← Linhas ímpares
                },
                '&:nth-of-type(even)': {
                    backgroundColor: '#f5f5f5',      // ← Linhas pares
                },
                '&:hover': {
                    backgroundColor: '#eaeaea',      // ← Cor ao passar o mouse
                },
            },
        },
    },
},
```

### Usando as cores do tema nos componentes

O MUI disponibiliza as cores do tema via `useTheme()` ou via props `sx`:

```tsx
import { useTheme } from '@mui/material';

const MeuComponente = () => {
    const theme = useTheme();

    return (
        // Usando useTheme()
        <Box sx={{ color: theme.palette.primary.main }}>
            Texto na cor primária
        </Box>

        // Usando sx (mais recomendado)
        <Button color="primary">Botão Primário</Button>
        <Button color="secondary">Botão Secundário</Button>
        <Typography color="text.secondary">Texto secundário</Typography>
        <Paper sx={{ bgcolor: 'background.paper' }}>Card</Paper>
    );
};
```

### Adicionando uma nova cor ao tema

Para adicionar uma cor personalizada, edite o `palette` no tema desejado:

```typescript
// Em Light.ts ou Dark.ts
palette: {
    primary: { main: "#083c94" },
    secondary: { main: cyan[700] },
    // Adicionando cor customizada
    success: { main: '#4caf50' },
    warning: { main: '#ff9800' },
    error: { main: '#f44336' },
    info: { main: '#2196f3' },
    // Ou crie uma customizada via augmentColor
}
```

Para usar uma cor customizada que não existe no MUI:

```typescript
// No tema
declare module '@mui/material/styles' {
    interface Palette {
        accent: Palette['primary'];
    }
    interface PaletteOptions {
        accent?: PaletteOptions['primary'];
    }
}

palette: {
    accent: { main: '#ff6b00' },
}
```

### Trocando de tema em runtime

O template já vem com um botão de alternância (sol/lua) no canto superior direito. A lógica fica em:

- **`src/Components/ToggleThemeButton/index.tsx`** — Botão visual com animação
- **`src/Contexts/ThemeContext.tsx`** — Gerencia o estado e persiste no `localStorage`

Para forçar um tema específico no código:

```typescript
// No ThemeContext.tsx, altere o valor inicial
const [themeName, setThemeName] = useState<'light' | 'dark'>('dark');  // ← Força dark
```