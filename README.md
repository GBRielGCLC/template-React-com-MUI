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