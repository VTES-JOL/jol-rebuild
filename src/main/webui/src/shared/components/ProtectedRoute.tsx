import {Navigate} from "react-router-dom";
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import type {JSX} from "react";

type ProtectedRouteViewProps = {
    children: JSX.Element;
    loading: boolean;
    user: unknown | null;
};

export function ProtectedRouteView({ children, loading, user }: ProtectedRouteViewProps) {
    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuthContext();

    return <ProtectedRouteView loading={loading} user={user} children={children} />;
}