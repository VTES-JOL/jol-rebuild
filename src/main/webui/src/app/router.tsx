import {BrowserRouter, Route, Routes} from "react-router-dom";
import LobbyPage from "@/features/lobby/LobbyPage";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import LoginForm from "@/features/auth/LoginForm.tsx";
import RegisterForm from "@/features/auth/RegisterForm.tsx";
import GamePage from "@/features/game/GamePage.tsx";
import DecksPage from "@/features/deck/DecksPage.tsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginForm/>}/>
                <Route path="/register" element={<RegisterForm/>}/>
                <Route path="/" element={<ProtectedRoute><LobbyPage/></ProtectedRoute>}/>
                <Route path="/decks" element={<ProtectedRoute><DecksPage/></ProtectedRoute>}/>
                <Route path="/game/:gameId" element={<GamePage/>}/>
                <Route path="/*" element={<ProtectedRoute><LobbyPage/></ProtectedRoute>}/>
            </Routes>
        </BrowserRouter>
    );
}