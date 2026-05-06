import AppRouter from "./router";
import {AuthProvider} from "@/contexts/AuthContext.tsx";
import {LobbySocketProvider} from "@/contexts/LobbySocketContext";

export default function App() {
    return (
        <AuthProvider>
            <LobbySocketProvider>
                <AppRouter />
            </LobbySocketProvider>
        </AuthProvider>
    );
}