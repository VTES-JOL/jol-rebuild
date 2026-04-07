import {createContext} from "react";
import type {User} from "./types";

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (u: string, p: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const authContextValue = createContext<AuthContextType | undefined>(undefined);