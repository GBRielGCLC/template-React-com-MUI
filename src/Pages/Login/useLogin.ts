import { useForm } from "react-hook-form";
import { useAuth } from "../../Contexts/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { yup } from "../../Services";

interface ILoginForm {
    email: string;
    password: string;
}

const loginSchema = yup.object({
    email: yup
        .string()
        .required('Informe o e-mail')
        .email('Informe um e-mail válido'),
    password: yup
        .string()
        .required('Informe a senha'),
});

export const useLogin = () => {
    const { login, isLoading } = useAuth();

    const [showPassword, setShowPassword] = useState(false)

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<ILoginForm>({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: ILoginForm) => {
        try {
            await login(data);
        } catch {
            // O AuthContext já exibe o toast com a mensagem da API.
        }
    };

    return {
        control,
        handleSubmit,
        onSubmit,
        errors,
        isLoading,

        showPassword,
        setShowPassword
    };
};
