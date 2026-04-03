import AppLayout from "@/shared/layout/AppLayout.tsx";
import ActiveGames from "./ActiveGames.tsx";
import {LobbyChatPanel} from "@/features/lobby/LobbyChatPanel.tsx";
import {useAuth} from "@/features/auth/AuthContext.tsx";

export default function LobbyPage() {

    const { user, loading } = useAuth();

    return (
        <AppLayout background="/Locations76.jpg">
            <div className="grid grid-cols-[1fr_5fr] gap-6 h-[85dvh]">
                <ActiveGames/>
                {!loading && user && (<LobbyChatPanel username={user.username} />)}
            </div>
        </AppLayout>
    );
}