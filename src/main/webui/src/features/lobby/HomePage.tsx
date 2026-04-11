import AppLayout from "@/shared/layout/AppLayout.tsx";
import ActiveGames from "./ActiveGames.tsx";
import {GlobalChatPanel} from "@/features/lobby/GlobalChatPanel.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";

export default function HomePage() {
    const {user, loading} = useAuthContext();

    return (
        <AppLayout background={"/Locations76.jpg"}>
            <div className="grid grid-cols-[1fr_5fr] gap-6 h-[85dvh]">
                <ActiveGames/>
                {!loading && user && <GlobalChatPanel username={user.username}/>}
            </div>
        </AppLayout>
    );
}