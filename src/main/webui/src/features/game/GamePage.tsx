import AppLayout from "@/shared/layout/AppLayout.tsx";
import {GameChatPanel} from "@/features/game/GameChatPanel.tsx";
import {useAuth} from "@/features/auth/AuthContext.tsx";
import {useParams} from "react-router-dom";

export default function GamePage() {

    const { user, loading } = useAuth();
    let { gameId } = useParams();
    if (!gameId) throw new Error("Missing Game ID");

    return (
        <AppLayout>
            {!loading && user && (<GameChatPanel username={user.username} wsBaseUrl="ws://localhost:8080" gameId={gameId} />)}
        </AppLayout>
    )
}