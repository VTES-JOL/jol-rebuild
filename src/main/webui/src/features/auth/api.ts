import type {RegisterField, RegisterResult, User} from "./types";

const API = {
    async profile(): Promise<User | null> {
        const res = await fetch("/user/profile", {
            credentials: "include",
        });

        const data = await res.json();
        return data ?? null;
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
    ): Promise<RegisterResult> {
        const res = await fetch("/user/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({username, password, email}),
        });

        if (res.status === 201) {
            return {ok: true, fieldErrors: {}};
        }

        if (res.status === 400) {
            const fieldErrors: Partial<Record<RegisterField, string>> = {};

            try {
                const data = await res.json();
                const violations = Array.isArray(data?.violations)
                    ? data.violations
                    : Array.isArray(data?.parameterViolations)
                        ? data.parameterViolations
                        : [];

                for (const violation of violations) {
                    const rawField = String(
                        violation?.field ??
                        violation?.path ??
                        violation?.propertyPath ??
                        ""
                    );
                    const field = rawField.split(".").pop() as RegisterField;
                    const message = String(violation?.message ?? "Invalid value");

                    if (field === "username" || field === "password" || field === "email") {
                        fieldErrors[field] = message;
                    }
                }
            } catch {
                // ignore parse errors and fall through with empty/partial errors
            }

            return {
                ok: false,
                fieldErrors,
                formError: Object.keys(fieldErrors).length ? undefined : "Validation failed.",
            };
        }

        if (res.status === 409) {
            return {
                ok: false,
                fieldErrors: {},
                formError: "Username already exists.",
            };
        }

        return {
            ok: false,
            fieldErrors: {},
            formError: "Registration failed. Please try again.",
        };
    },
};

export default API;