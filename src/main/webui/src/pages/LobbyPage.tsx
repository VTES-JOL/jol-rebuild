import {useNavigate} from "react-router-dom";
import API from "../services/api";
import AppLayout from "../components/layout/AppLayout.tsx";
import ChatPanel from "../components/chat/ChatPanel.tsx";
import ActiveGames from "../components/game/ActiveGames.tsx";

export default function LobbyPage() {
    const navigate = useNavigate();

    async function handleLogout(): Promise<void> {
        await API.logout();
        navigate("/login");
    }

    return (
        <AppLayout background="https://static.deckserver.net/assets/images/Locations14.jpg">
            <div className="grid grid-cols-[350px_1fr] gap-6 h-[80vh]">
                <ActiveGames/>
                <ChatPanel/>
            </div>
            <button onClick={handleLogout}>Logout</button>
        </AppLayout>
    );
}