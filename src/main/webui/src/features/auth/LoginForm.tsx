import Panel from "@/shared/components/Panel.tsx";
import Button from "@/shared/components/Button.tsx";
import Input from "@/shared/components/Input.tsx";
import {useAuthContext} from "@/features/auth/AuthContext.tsx";
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
        if (ok) navigate("/");
        else setError("Invalid username or password.");
    };

    return (
        <HeroLayout background={"/Locations52.jpg"}>
            <Panel title="Login" className="w-full sm:w-96">
                <form className="space-y-4 p-4" onSubmit={handleSubmit} noValidate>

                    {successMessage && (
                        <p className="text-sm text-online border border-online/30 rounded px-3 py-2" role="status">
                            {successMessage}
                        </p>
                    )}

                    <Input
                        id="username"
                        name="username"
                        srLabel="Username"
                        autoFocus
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                    />

                    <Input
                        id="password"
                        name="password"
                        srLabel="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        right={
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="text-ink-muted hover:text-ink"
                            >
                                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        }
                    />

                    {error && <p className="text-blood text-sm" role="alert">{error}</p>}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="w-full justify-center"
                    >
                        {loading ? "Signing in…" : "Login"}
                    </Button>

                    <p className="text-ink-secondary text-center text-sm">
                        Need an account?{" "}
                        <Link to="/register" className="underline hover:text-accent">Register here</Link>
                    </p>

                </form>
            </Panel>
        </HeroLayout>
    );
}