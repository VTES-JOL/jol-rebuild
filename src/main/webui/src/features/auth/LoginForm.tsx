import Panel from "@/shared/components/Panel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import {useNavigate} from "react-router-dom";
import {type SubmitEvent, useState} from "react";
import HeroLayout from "@/shared/layout/HeroLayout.tsx";

export default function LoginForm() {

    const {login} = useAuthContext();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const ok = await login(username, password);
        if (ok) navigate("/lobby")
        else setError("Invalid Username or Password.");
    }

    return (
        <HeroLayout>
            <Panel title={"Login"} className={"w-1/4"}>
                <form className="space-y-4 p-4" onSubmit={handleSubmit}>
                    <input
                        className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                        value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username"/>
                    <input
                        className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"/>

                    {error && <p className="text-blood text-sm">{error}</p>}

                    <button type={"submit"} className="w-full bg-accent text-surface py-2 rounded hover:bg-accent-dim transition-colors">Login</button>

                    <div className="text-ink-muted mx-auto text-center w-4/5">Need an account? <a
                        className="underline hover:text-accent cursor-pointer" onClick={() => navigate("/register")}>Register
                        here</a></div>

                </form>
            </Panel>
        </HeroLayout>
    )
}