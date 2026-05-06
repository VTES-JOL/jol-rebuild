import AppRouter from "./router";
import {AuthProvider} from "@/contexts/AuthContext.tsx";
import {LobbySocketProvider} from "@/contexts/LobbySocketContext";
import ErrorBoundary from "@/shared/components/ErrorBoundary";

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <LobbySocketProvider>
                    <ErrorBoundary>
                        <AppRouter />
                    </ErrorBoundary>
                </LobbySocketProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}