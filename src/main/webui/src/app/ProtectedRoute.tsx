import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";
import type { User } from "./types";

interface Props {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

    useEffect(() => {
        API.profile().then((user: User | null) => {
            setStatus(user ? "authenticated" : "unauthenticated");
        });
    }, []);

    if (status === "loading") {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}