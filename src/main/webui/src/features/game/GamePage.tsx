import AppLayout from "@/shared/layout/AppLayout.tsx";
import {GameChatPanel} from "@/features/game/GameChatPanel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import {useParams} from "react-router-dom";

export default function GamePage() {

    const { user, loading } = useAuthContext();
    const { gameId } = useParams();
    if (!gameId) throw new Error("Missing Game ID");

    return (
        <AppLayout>
            {!loading && user && (<GameChatPanel username={user.username} gameId={gameId} />)}
        </AppLayout>
    )
}