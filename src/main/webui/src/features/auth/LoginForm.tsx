import Panel from "@/shared/components/Panel.tsx";
import {useAuth} from "@/features/auth/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import {type SubmitEvent, useState} from "react";
import HeroLayout from "@/shared/layout/HeroLayout.tsx";

export default function LoginForm() {

    const {login} = useAuth();
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
        <HeroLayout background={"https://static.deckserver.net/assets/images/Locations52.jpg"}>
            <Panel title={"Login"} className={"w-1/4"}>
                <form className="space-y-4 p-4" onSubmit={handleSubmit}>
                    <input
                        className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username"/>
                    <input
                        className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"/>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <button type={"submit"} className="w-full bg-blue-500 text-white py-2 rounded">Login</button>

                    <div className={"text-gray-200 mx-auto text-center w-4/5"}>Need an account? <a
                        className={"underline hover:text-blue-500"} onClick={() => navigate("/register")}>Register
                        here</a></div>

                </form>
            </Panel>
        </HeroLayout>
    )
}