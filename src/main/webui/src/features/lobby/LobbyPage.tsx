import {useRef} from 'react';
import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import OpenGamesPanel from "./OpenGamesPanel.tsx";
import MyLobbyPanel, {type MyLobbyPanelHandle} from "./MyLobbyPanel.tsx";

export default function LobbyPage() {
    const {user, loading} = useAuthContext();
    const myPanelRef = useRef<MyLobbyPanelHandle>(null);

    return (
        <AppLayout background={"/Locations76.jpg"}>
            <div className="grid grid-cols-[1fr_3fr] gap-6 h-[85dvh]">
                {!loading && user && (
                    <MyLobbyPanel
                        ref={myPanelRef}
                        currentUsername={user.username}
                    />
                )}
                {!loading && user && (
                    <OpenGamesPanel
                        currentUsername={user.username}
                        onChanged={() => myPanelRef.current?.refresh()}
                    />
                )}
            </div>
        </AppLayout>
    );
}
