import Panel from "@/shared/components/Panel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useState} from "react";
import HeroLayout from "@/shared/layout/HeroLayout.tsx";
import {Eye, EyeOff} from "lucide-react";

export default function LoginForm() {
    const {login} = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = (location.state as { message?: string } | null)?.message;

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const ok = await login(username, password);
        setLoading(false);
        if (ok) navigate("/lobby");
        else setError("Invalid username or password.");
    };

    return (
        <HeroLayout>
            <Panel title="Login" className="w-full sm:w-96">
                <form className="space-y-4 p-4" onSubmit={handleSubmit} noValidate>

                    {successMessage && (
                        <p className="text-sm text-online border border-online/30 rounded px-3 py-2" role="status">
                            {successMessage}
                        </p>
                    )}

                    <div>
                        <label htmlFor="username" className="sr-only">Username</label>
                        <input
                            id="username"
                            name="username"
                            autoFocus
                            autoComplete="username"
                            required
                            className="w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                        />
                    </div>

                    <div className="relative">
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            className="w-full px-4 py-2 pr-10 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                        >
                            {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                    </div>

                    {error && <p className="text-blood text-sm" role="alert">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent text-surface py-2 rounded hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in…" : "Login"}
                    </button>

                    <p className="text-ink-muted text-center text-sm">
                        Need an account?{" "}
                        <Link to="/register" className="underline hover:text-accent">Register here</Link>
                    </p>

                </form>
            </Panel>
        </HeroLayout>
    );
}