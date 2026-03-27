import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function LoginPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [email, setEmail] = useState<string>("");

    async function handleLogin(): Promise<void> {
        const ok = await API.login(username, password);
        if (ok) {
            navigate("/lobby");
        } else {
            alert("Login failed");
        }
    }

    async function handleRegister(): Promise<void> {
        const ok = await API.register(username, password, email);
        if (ok) {
            alert("Registered! Now log in.");
        } else {
            alert("Registration failed");
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

                <div className="space-y-4">
                    <input
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                    />

                    <input
                        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                    />

                    <button
                        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
                        onClick={handleLogin}
                    >
                        Login
                    </button>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 text-center">Register</h2>
                    <div className="space-y-4">
                        <input
                            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email"
                        />
                        <button
                            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition duration-200"
                            onClick={handleRegister}
                        >
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}