import AppLayout from "@/shared/layout/AppLayout.tsx";
import ActiveGames from "./ActiveGames.tsx";
import {LobbyChatPanel} from "@/features/lobby/LobbyChatPanel.tsx";
import {useAuth} from "@/features/auth/AuthContext.tsx";

export default function LobbyPage() {

    const { user, loading } = useAuth();

    return (
        <AppLayout background="https://static.deckserver.net/assets/images/Locations14.jpg">
            <div className="grid grid-cols-[1fr_4fr] gap-6 h-[90vh] mt-12">
                <ActiveGames/>
                {!loading && user && (<LobbyChatPanel username={user.username} wsBaseUrl="ws://localhost:8080" />)}
            </div>
        </AppLayout>
    );
}