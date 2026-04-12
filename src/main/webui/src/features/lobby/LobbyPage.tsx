import {useEffect, useRef} from 'react';
import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import OpenGamesPanel from "./OpenGamesPanel.tsx";
import MyLobbyPanel, {type MyLobbyPanelHandle} from "./MyLobbyPanel.tsx";
import {useLobbySocket} from "./LobbySocketContext.tsx";
import SplitView from "@/shared/layout/SplitView.tsx";

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
            {!loading && user && (
                <SplitView
                    panels={[
                        {
                            key: 'my',
                            label: 'My Games',
                            content: (
                                <MyLobbyPanel
                                    ref={myPanelRef}
                                    currentUsername={user.username}
                                />
                            ),
                        },
                        {
                            key: 'open',
                            label: 'Open Games',
                            content: (
                                <OpenGamesPanel
                                    currentUsername={user.username}
                                    onRefreshRef={openPanelRefresh}
                                    onChanged={() => myPanelRef.current?.refresh()}
                                />
                            ),
                        },
                    ]}
                    columns="260px 1fr"
                />
            )}
        </AppLayout>
    );
}
