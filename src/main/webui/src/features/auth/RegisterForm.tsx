import Panel from "@/shared/components/Panel.tsx";
import {useState, type MouseEventHandler} from "react";
import API from "@/features/auth/api.ts";
import {useNavigate} from "react-router-dom";
import type { RegisterField } from "@/features/auth/types.ts";

interface RegisterFormProps {
    onClick? : MouseEventHandler<HTMLAnchorElement>;
}

export default function RegisterForm({onClick} : RegisterFormProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
    const [formError, setFormError] = useState<string>("");
    const navigate = useNavigate();

    async function handleRegister() {
        setFieldErrors({});
        setFormError("");

        const result = await API.register(username, password, email);
        if (result.ok) {
            navigate("/login");
        } else {
            setFieldErrors(result.fieldErrors);
            setFormError(result.formError ?? "");
        }
    }

    return (
        <Panel title={"Register"} className={"w-1/4"}>
            <div className="space-y-4 p-4">
                <input
                    className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"/>
                {fieldErrors.username && <p className="text-red-400 text-sm">{fieldErrors.username}</p>}

                <input
                    className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"/>
                {fieldErrors.password && <p className="text-red-400 text-sm">{fieldErrors.password}</p>}

                <input
                    className="w-full px-4 py-2 border border-slate-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address"/>
                {fieldErrors.email && <p className="text-red-400 text-sm">{fieldErrors.email}</p>}

                {formError && <p className="text-red-400 text-sm">{formError}</p>}

                <button
                    className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition duration-200"
                    onClick={handleRegister}>Register
                </button>

                <div className={"text-gray-200 mx-auto text-center w-4/5"}>Already have an account? <a className={"underline hover:text-green-500"} onClick={onClick}>Login here</a></div>
            </div>
        </Panel>
    )
}