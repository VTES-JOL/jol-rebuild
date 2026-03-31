import Panel from "@/shared/components/Panel.tsx";
import {useAuth} from "@/features/auth/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import {useState, type MouseEventHandler} from "react";

interface LoginFormProps {
    onClick? : MouseEventHandler<HTMLAnchorElement>;
}

export default function LoginForm({onClick} : LoginFormProps) {

    const {login} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function handleLogin() {
        const ok = await login(username, password);
        if (ok) navigate("/lobby");
        else alert("Login failed");
    }

    return (
        <Panel title={"Login"} className={"w-1/4"}>
            <div className="space-y-4 p-4">
                <input
                    className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username"/>
                <input
                    className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"/>
                <button className="w-full bg-blue-500 text-white py-2 rounded" onClick={handleLogin}>Login</button>

                <div className={"text-gray-200 mx-auto text-center w-4/5"}>Need an account? <a className={"underline hover:text-blue-500"} onClick={onClick}>Register here</a></div>

            </div>
        </Panel>
    )
}