import { useForm } from "react-hook-form";
import { useAuth } from "../../Contexts/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { yup } from "../../Services";

interface ILoginForm {
    name: string;
    password: string;
}

const loginSchema = yup.object({
  name: yup
    .string()
    .required('Informe o usuário'),
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
            name: "",
            password: "",
        },
    });

    const onSubmit = async (data: ILoginForm) => {
        await login(data);
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
