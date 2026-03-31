export interface User {
    id: number;
    username: string;
    email?: string;
}

export type RegisterField = "username" | "password" | "email";

export interface RegisterResult {
    ok: boolean;
    fieldErrors: Partial<Record<RegisterField, string>>;
    formError?: string;
}