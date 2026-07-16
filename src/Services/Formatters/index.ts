import dayjs from "dayjs";

export const formatarMoeda = (valor?: number | null): string => {
    if (!valor) valor = 0;

    return valor.toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
    });
}

export const formatarNumero = (valor?: number | null): string => {
    if (!valor) valor = 0;

    const options = {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    };

    return valor.toLocaleString('pt-br', options);
}

export const formatarDataTela = (date?: string | null): string => {
    if (!date) return "-";

    let data = dayjs(date);

    if (!data.isValid()) {
        return "-"
    }

    return data.format('DD/MM/YYYY')
}
