import AppLayout from "@/shared/layout/AppLayout.tsx";
import ActiveGames from "./ActiveGames.tsx";
import {GlobalChatPanel} from "@/features/lobby/GlobalChatPanel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import SplitView from "@/shared/layout/SplitView.tsx";

export default function HomePage() {
    const {user, loading} = useAuthContext();

    return (
        <AppLayout background={"/Locations76.jpg"}>
            <SplitView
                panels={[
                    {key: 'active', label: 'Active Games', content: <ActiveGames />},
                    {key: 'chat',   label: 'Global Chat',  content: !loading && user ? <GlobalChatPanel username={user.username}/> : <div/>},
                ]}
                columns="280px 1fr"
            />
        </AppLayout>
    );
}