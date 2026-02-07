import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth.context';

export const ProtectedRoute = () => {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
