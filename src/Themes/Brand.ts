/**
 * Cores da marca Quitta — extraídas de public/logo.png.
 * O logo é um gradiente: violeta/periwinkle → azul-petróleo → teal.
 */
export const brand = {
    violet: {
        main: '#5A5FA8',
        light: '#7B84C7',
        dark: '#373E80',
    },
    blue: {
        main: '#39688C',
        dark: '#283868',
        light: '#7C8CB4',
    },
    teal: {
        main: '#2E8B84',
        light: '#5AB0A7',
        dark: '#1F6E68',
    },
} as const;

/**
 * Gradiente principal do logo. Usar em destaques, cabeçalhos de tabela,
 * bordas ou qualquer elemento que queira carregar a identidade visual.
 */
export const brandGradient =
    `linear-gradient(90deg, ${brand.violet.main} 0%, ${brand.blue.main} 50%, ${brand.teal.main} 100%)`;

/** Versão mais escura do gradiente (para textos sobre fundo claro). */
export const brandGradientDark =
    `linear-gradient(90deg, ${brand.violet.dark} 0%, ${brand.blue.dark} 50%, ${brand.teal.dark} 100%)`;
