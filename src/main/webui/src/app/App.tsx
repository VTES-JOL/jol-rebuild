import {BrowserRouter, Route, Routes} from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import LobbyPage from "../pages/LobbyPage";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/lobby" element={<ProtectedRoute><LobbyPage/></ProtectedRoute>}/>
                <Route path="*" element={<LoginPage/>}/>
            </Routes>
        </BrowserRouter>
    );
}