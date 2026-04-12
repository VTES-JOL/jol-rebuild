import Panel from "@/shared/components/Panel.tsx";
import Button from "@/shared/components/Button.tsx";
import Input from "@/shared/components/Input.tsx";
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

    return (
        <HeroLayout background={"/Locations52.jpg"}>
            <Panel title="Register" className="w-full sm:w-96">
                <form className="space-y-4 p-4" onSubmit={handleRegister} noValidate>

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
                        error={fieldErrors.username}
                    />

                    <Input
                        id="email"
                        name="email"
                        srLabel="Email address"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        error={fieldErrors.email}
                    />

                    <Input
                        id="password"
                        name="password"
                        srLabel="Password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        error={fieldErrors.password}
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

                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        srLabel="Confirm password"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        error={fieldErrors.confirmPassword}
                        right={
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                                className="text-ink-muted hover:text-ink"
                            >
                                {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                        }
                    />

                    {formError && <p className="text-blood text-sm" role="alert">{formError}</p>}

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        className="w-full justify-center"
                    >
                        {loading ? "Creating account…" : "Register"}
                    </Button>

                    <p className="text-ink-secondary text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:text-accent">Login here</Link>
                    </p>

                </form>
            </Panel>
        </HeroLayout>
    );
}