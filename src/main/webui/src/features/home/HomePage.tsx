import AppLayout from "@/shared/layout/AppLayout.tsx";
import ActiveGames from "@/features/home/ActiveGames.tsx";
import {GlobalChatPanel} from "@/features/home/GlobalChatPanel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import MasterDetailView from "@/shared/layout/MasterDetailView.tsx";

export default function HomePage() {
    const {user, loading} = useAuthContext();

    return (
        <AppLayout background={"/Locations76.jpg"}>
            <MasterDetailView
                panels={[
                    {key: 'active', label: 'Active Games', content: <ActiveGames />},
                    {key: 'chat',   label: 'Global Chat',  content: !loading && user ? <GlobalChatPanel username={user.username}/> : <div/>},
                ]}
                columns="320px 1fr"
            />
        </AppLayout>
    );
}