import Panel from "@/shared/components/Panel.tsx";
import {type SubmitEvent, useState} from "react";
import API from "@/features/auth/api.ts";
import {useNavigate} from "react-router-dom";
import type {RegisterField} from "@/features/auth/types.ts";
import HeroLayout from "@/shared/layout/HeroLayout.tsx";

export default function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
    const [formError, setFormError] = useState<string>("");
    const navigate = useNavigate();

    const handleRegister = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});
        setFormError("");

        const result = await API.register(username, password, email);
        console.log(result);
        if (result.ok) {
            navigate("/login");
        } else {
            setFieldErrors(result.fieldErrors);
            setFormError(result.formError ?? "");
        }
    }

    return (
        <HeroLayout>
            <Panel title={"Register"} className={"w-1/4"}>
                <form className="space-y-4 p-4" onSubmit={handleRegister}>
                    <input
                        className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                        value={username} required onChange={(e) => setUsername(e.target.value)} placeholder="Username"/>
                    {fieldErrors.username && <p className="text-blood text-sm">{fieldErrors.username}</p>}

                    <input
                        className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"/>
                    {fieldErrors.password && <p className="text-blood text-sm">{fieldErrors.password}</p>}

                    <input
                        className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address"/>
                    {fieldErrors.email && <p className="text-blood text-sm">{fieldErrors.email}</p>}

                    {formError && <p className="text-blood text-sm">{formError}</p>}

                    <button
                        className="w-full bg-accent text-surface py-2 rounded hover:bg-accent-dim transition-colors">Register
                    </button>

                    <div className="text-ink-muted mx-auto text-center w-4/5">Already have an account? <a
                        className="underline hover:text-accent cursor-pointer" onClick={() => navigate("/login")}>Login here</a>
                    </div>
                </form>
            </Panel>
        </HeroLayout>
    )
}