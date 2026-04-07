import AppRouter from "./router";
import {AuthProvider} from "@/features/auth/AuthContext.tsx";

export default function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}