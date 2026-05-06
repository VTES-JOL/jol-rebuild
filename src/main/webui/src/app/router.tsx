import {lazy, Suspense} from 'react';
import {BrowserRouter, Route, Routes} from "react-router-dom";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import Spinner from "@/shared/components/Spinner";

const HomePage = lazy(() => import("@/features/home/HomePage.tsx"));
const LobbyPage = lazy(() => import("@/features/lobby/LobbyPage.tsx"));
const LoginPage = lazy(() => import("@/features/auth/LoginPage.tsx"));
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage.tsx"));
const GamePage = lazy(() => import("@/features/game/GamePage.tsx"));
const DecksPage = lazy(() => import("@/features/deck/DecksPage.tsx"));
const TournamentsPage = lazy(() => import("@/features/tournament/TournamentsPage.tsx"));
const ProfilePage = lazy(() => import("@/features/profile/ProfilePage.tsx"));

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Suspense fallback={<div className="h-screen flex items-center justify-center"><Spinner /></div>}>
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
            </Suspense>
        </BrowserRouter>
    );
}