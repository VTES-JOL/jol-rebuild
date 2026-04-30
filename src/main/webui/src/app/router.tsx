import {BrowserRouter, Route, Routes} from "react-router-dom";
import HomePage from "@/features/home/HomePage.tsx";
import LobbyPage from "@/features/lobby/LobbyPage.tsx";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import LoginPage from "@/features/auth/LoginPage.tsx";
import RegisterPage from "@/features/auth/RegisterPage.tsx";
import GamePage from "@/features/game/GamePage.tsx";
import DecksPage from "@/features/deck/DecksPage.tsx";
import TournamentsPage from "@/features/tournament/TournamentsPage.tsx";
import ProfilePage from "@/features/profile/ProfilePage.tsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/" element={<ProtectedRoute><HomePage/></ProtectedRoute>}/>
                <Route path="/lobby" element={<ProtectedRoute><LobbyPage/></ProtectedRoute>}/>
                <Route path="/decks" element={<ProtectedRoute><DecksPage/></ProtectedRoute>}/>
                <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage/></ProtectedRoute>}/>
                <Route path="/game/:gameId" element={<ProtectedRoute><GamePage/></ProtectedRoute>}/>
                <Route path="/profile" element={<ProtectedRoute><ProfilePage/></ProtectedRoute>}/>
                <Route path="/*" element={<ProtectedRoute><HomePage/></ProtectedRoute>}/>
            </Routes>
        </BrowserRouter>
    );
}