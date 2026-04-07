import { useEffect, useState, type ReactNode } from "react";
import type { User } from "./types";
import API from "./api";
import { authContextValue } from "./authContextValue.ts";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function refresh() {
        const u = await API.profile();
        setUser(u);
        setLoading(false);
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
        <authContextValue.Provider
            value={{
                user,
                loading,
                login: handleLogin,
                logout: handleLogout,
                refresh,
            }}
        >
            {children}
        </authContextValue.Provider>
    );
}