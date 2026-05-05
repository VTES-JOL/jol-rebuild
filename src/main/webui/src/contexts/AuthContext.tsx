import React, {createContext, useContext, useEffect, useState} from "react";
import type {User} from "@/features/auth/types";
import API from "@/features/auth/api";
import {setUnauthorizedHandler} from "@/shared/api/client.ts";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (u: string, p: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
        });
    }, []);

    async function refresh() {
        try {
            const u = await API.profile();
            setUser(u);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void refresh();
        }, 0);

        return () => window.clearTimeout(timer);
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

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
    return ctx;
}