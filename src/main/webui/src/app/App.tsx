import AppRouter from "./router";
import {AuthProvider} from "@/features/auth/AuthContext.tsx";
import {LobbySocketProvider} from "@/features/lobby/LobbySocketContext.tsx";

export default function App() {
    return (
        <AuthProvider>
            <LobbySocketProvider>
                <AppRouter />
            </LobbySocketProvider>
        </AuthProvider>
    );
}