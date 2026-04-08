import Panel from "@/shared/components/Panel.tsx";
import {useState} from "react";
import API from "@/features/auth/api.ts";
import {Link, useNavigate} from "react-router-dom";
import type {RegisterField} from "@/features/auth/types.ts";
import HeroLayout from "@/shared/layout/HeroLayout.tsx";
import {Eye, EyeOff} from "lucide-react";

export default function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField | "confirmPassword", string>>>({});
    const [formError, setFormError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFieldErrors({});
        setFormError("");

        if (password !== confirmPassword) {
            setFieldErrors({confirmPassword: "Passwords do not match."});
            return;
        }

        setLoading(true);
        const result = await API.register(username, password, email);
        setLoading(false);

        if (result.ok) {
            navigate("/login", {state: {message: "Account created! Please sign in."}});
        } else {
            setFieldErrors(result.fieldErrors);
            setFormError(result.formError ?? "");
        }
    };

    const inputClass = "w-full px-4 py-2 rounded bg-surface/70 border border-line text-ink placeholder:text-ink-muted focus:outline-none focus:border-line-accent focus:ring-1 focus:ring-accent/30";

    return (
        <HeroLayout background={"/Locations52.jpg"}>
            <Panel title="Register" className="w-full sm:w-96">
                <form className="space-y-4 p-4" onSubmit={handleRegister} noValidate>

                    <div>
                        <label htmlFor="username" className="sr-only">Username</label>
                        <input
                            id="username"
                            name="username"
                            autoFocus
                            autoComplete="username"
                            required
                            className={inputClass}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                        />
                        {fieldErrors.username && (
                            <p className="text-blood text-sm mt-1" role="alert">{fieldErrors.username}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="email" className="sr-only">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className={inputClass}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                        />
                        {fieldErrors.email && (
                            <p className="text-blood text-sm mt-1" role="alert">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                className={`${inputClass} pr-10`}
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
                        {fieldErrors.password && (
                            <p className="text-blood text-sm mt-1" role="alert">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div>
                        <div className="relative">
                            <label htmlFor="confirmPassword" className="sr-only">Confirm password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                className={`${inputClass} pr-10`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                            >
                                {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="text-blood text-sm mt-1" role="alert">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {formError && <p className="text-blood text-sm" role="alert">{formError}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent text-surface py-2 rounded hover:bg-accent-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating account…" : "Register"}
                    </button>

                    <p className="text-ink-muted text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:text-accent">Login here</Link>
                    </p>

                </form>
            </Panel>
        </HeroLayout>
    );
}