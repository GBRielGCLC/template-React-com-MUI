import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from '../Pages/Home';
import { NotFound } from '../Pages/NotFound';
import { ArrayTelas } from '../Pages/Home/ArrayTelas';
import { useAllowedRoles } from '../Utils/roles';
import { AccessDenied } from '../Pages/AccessDenied';

export const AppRoutes = () => {
    const hasAccess = useAllowedRoles();
    const telas = ArrayTelas();

    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />

            {telas.map((tela) => (
                <Route key={tela.path} path={tela.path} element={
                    tela.desabilitado
                        ? <AccessDenied />
                        : hasAccess(tela.allowedRoles)
                            ? tela.element
                            : <AccessDenied />
                } />
            ))}

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};
