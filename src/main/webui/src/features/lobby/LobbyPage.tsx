import AppLayout from "../../shared/layout/AppLayout.tsx";
import ChatPanel from "./ChatPanel.tsx";
import ActiveGames from "./ActiveGames.tsx";

export default function LobbyPage() {

    return (
        <AppLayout background="https://static.deckserver.net/assets/images/Locations14.jpg">
            <div className="grid grid-cols-[1fr_4fr] gap-6 h-[90vh] mt-12">
                <ActiveGames/>
                <ChatPanel/>
            </div>
        </AppLayout>
    );
}