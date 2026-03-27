import type { User } from "../app/types";

const API = {
    async profile(): Promise<User | null> {
        const res = await fetch("/user/profile", {
            credentials: "include",
        });

        if (!res.ok) return null;
        return res.json() as Promise<User>;
    },

    async login(username: string, password: string): Promise<boolean> {
        const form = new URLSearchParams();
        form.append("j_username", username);
        form.append("j_password", password);

        const res = await fetch("/user/login", {
            method: "POST",
            body: form,
            credentials: "include",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        return res.ok;
    },

    async logout(): Promise<void> {
        await fetch("/user/logout", {
            method: "POST",
            credentials: "include",
        });
    },

    async register(
        username: string,
        password: string,
        email: string
    ): Promise<boolean> {
        const res = await fetch("/user/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password, email }),
        });

        return res.ok;
    },
};

export default API;