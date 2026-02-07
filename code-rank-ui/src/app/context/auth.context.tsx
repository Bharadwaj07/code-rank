import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    email: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, username: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    useEffect(() => {
        const initAuth = async () => {
            if (token && !user) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to restore session:', error);
                    setToken(null);
                }
            }
        };
        initAuth();
    }, [token, user]);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, userId, username } = response.data;

            // Store token immediately to avoid race conditions with next API calls
            localStorage.setItem('token', accessToken);
            setToken(accessToken);

            setUser({ id: userId, email, username: username || email });
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, username: string) => {
        try {
            await api.post('/auth/register', { email, password, username });
            // Auto login after register or redirect to login? Let's redirect to login for now.
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            register,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
