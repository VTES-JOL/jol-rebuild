import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "./AuthContext";
import API from "./api.ts";
import Panel from "../../shared/components/Panel.tsx";

export default function HomePage() {
    const {login} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    async function handleLogin() {
        const ok = await login(username, password);
        if (ok) navigate("/lobby");
        else alert("Login failed");
    }

    async function handleRegister() {
        const ok = await API.register(username, password, email);
        if (ok) navigate("/lobby");
        else alert("Registration failed");
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 min-h-screen bg-slate-800" style={{backgroundImage: `url(https://static.deckserver.net/assets/images/Locations52.jpg)`, backgroundSize: "cover"}}>
            <Panel title={"Login"}>
                <div className="space-y-4 p-4">
                    <input
                        className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                    />

                    <input
                        className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                    />

                    <button
                        className="w-full bg-blue-500 text-white py-2 rounded"
                        onClick={handleLogin}
                    >
                        Login
                    </button>
                </div>
            </Panel>

            <Panel title={"Register"}>
                <div className="space-y-4 p-4">
                    <input
                        className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                    />
                    <button
                        className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition duration-200"
                        onClick={handleRegister}>
                        Register
                    </button>
                </div>
            </Panel>
        </div>
    );
}