import {useEffect, useRef} from 'react';
import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import OpenGamesPanel from "./OpenGamesPanel.tsx";
import MyLobbyPanel, {type MyLobbyPanelHandle} from "./MyLobbyPanel.tsx";
import {useLobbySocket} from "./LobbySocketContext.tsx";

export default function LobbyPage() {
    const {user, loading} = useAuthContext();
    const myPanelRef = useRef<MyLobbyPanelHandle>(null);
    const openPanelRefresh = useRef<(() => void) | null>(null);
    const {subscribeToLobby} = useLobbySocket();

    useEffect(() => {
        return subscribeToLobby(() => {
            openPanelRefresh.current?.();
            myPanelRef.current?.refresh();
        });
    }, [subscribeToLobby]);

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
                        onRefreshRef={openPanelRefresh}
                        onChanged={() => myPanelRef.current?.refresh()}
                    />
                )}
            </div>
        </AppLayout>
    );
}
