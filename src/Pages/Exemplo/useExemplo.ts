import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { yup } from '../../Services/Yup';
import { useState } from 'react';
import dayjs from 'dayjs';

interface IExemploForm {
    nome: string;
    email: string;
    senha: string;
    numero: number | null;
    valor: number | null;
    data: dayjs.Dayjs | null;
    dataHora: dayjs.Dayjs | null;
    select: string;
    multiline: string;
    switchAtivo: boolean;
    checkbox: boolean;
    radio: string;
    autocomplete: string;
}

const schema = yup.object().shape({
    nome: yup.string().required().min(3),
    email: yup.string().required().email(),
    senha: yup.string().required().min(6),
    numero: yup.number().required().nullable().integer().positive(),
    valor: yup.number().required().nullable().min(0),
    data: yup.mixed<dayjs.Dayjs>().required().nullable().defined(),
    dataHora: yup.mixed<dayjs.Dayjs>().required().nullable().defined(),
    select: yup.string().required(),
    multiline: yup.string().required(),
    switchAtivo: yup.boolean().required().isTrue(),
    checkbox: yup.boolean().required().isTrue(),
    radio: yup.string().required(),
    autocomplete: yup.string().required(),
});

export const useExemplo = () => {
    const [isLoading, setIsLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
    } = useForm<IExemploForm>({
        resolver: yupResolver(schema) as any,
        defaultValues: {
            nome: '',
            email: '',
            senha: '',
            numero: null,
            valor: null,
            data: null,
            dataHora: null,
            select: '',
            multiline: '',
            switchAtivo: false,
            checkbox: false,
            radio: '',
            autocomplete: '',
        },
    });

    const onSubmit = async (data: IExemploForm) => {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Dados do formulário:', data);
        setIsLoading(false);
    };

    return {
        control,
        handleSubmit,
        errors,
        isLoading,
        onSubmit,
        reset,
        watch,
    };
};

export type { IExemploForm };
