import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import OpenGamesPanel from "./OpenGamesPanel.tsx";
import MyInvitationsPanel from "./MyInvitationsPanel.tsx";

export default function LobbyPage() {
    const {user, loading} = useAuthContext();

    return (
        <AppLayout background={"/Locations76.jpg"}>
            <div className="grid grid-cols-[1fr_3fr] gap-6 h-[85dvh]">
                {!loading && user && (
                    <MyInvitationsPanel currentUsername={user.username}/>
                )}
                {!loading && user && (
                    <OpenGamesPanel currentUsername={user.username}/>
                )}
            </div>
        </AppLayout>
    );
}
