import {useContext} from "react";
import {authContextValue} from "@/features/auth/authContextValue.ts";

export function useAuthContext() {
    const ctx = useContext(authContextValue);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}