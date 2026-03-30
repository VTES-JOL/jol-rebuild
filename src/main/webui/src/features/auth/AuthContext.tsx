import {createContext, type ReactNode, useContext, useEffect, useState,} from "react";
import type {User} from "./types";
import API from "./api";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (u: string, p: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        const u = await API.profile();
        setUser(u);
        setLoading(false);
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleLogin(username: string, password: string) {
        const ok = await API.login(username, password);
        if (ok) {
            await refresh();
        }
        return ok;
    }

    async function handleLogout() {
        await API.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login: handleLogin,
                logout: handleLogout,
                refresh,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}