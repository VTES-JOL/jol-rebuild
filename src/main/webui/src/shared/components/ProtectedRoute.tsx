import {Navigate} from "react-router-dom";
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import type {JSX} from "react";
import Spinner from "./Spinner";

type ProtectedRouteViewProps = {
    children: JSX.Element;
    loading: boolean;
    user: unknown | null;
};

export function ProtectedRouteView({ children, loading, user }: ProtectedRouteViewProps) {
    if (loading) return <Spinner message="Loading..." className="justify-center h-screen" />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuthContext();

    return <ProtectedRouteView loading={loading} user={user} children={children} />;
}
