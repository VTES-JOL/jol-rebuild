export interface User {
    id: string;
    username: string;
    email?: string;
    roles: string[];
    countryCode?: string;
    zoneId?: string;
    enableImages: boolean;
}

export type RegisterField = "username" | "password" | "email";

export interface RegisterResult {
    ok: boolean;
    fieldErrors: Partial<Record<RegisterField, string>>;
    formError?: string;
}