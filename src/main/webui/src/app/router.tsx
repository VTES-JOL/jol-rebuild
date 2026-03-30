import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "../features/auth/HomePage.tsx";
import LobbyPage from "../features/lobby/LobbyPage";
import ProtectedRoute from "../shared/components/ProtectedRoute";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<HomePage />} />
                <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>}/>
                <Route path="/*" element={<HomePage/>}/>
            </Routes>
        </BrowserRouter>
    );
}