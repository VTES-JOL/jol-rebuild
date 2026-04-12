import {useEffect, useState} from 'react';
import {Gamepad2} from 'lucide-react';
import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import {useLobbySocket} from "./LobbySocketContext.tsx";
import gameApi, {type GameDto} from '@/features/game/api';
import GameListPanel from './GameListPanel';
import GameDetailsPanel from './GameDetailsPanel';
import CreateGameModal from './CreateGameModal';
import EmptyState from '@/shared/components/EmptyState';

import MasterDetailView from "@/shared/layout/MasterDetailView.tsx";

export default function LobbyPage() {
    const {user, loading: authLoading} = useAuthContext();
    const {subscribeToLobby} = useLobbySocket();
    
    const [games, setGames] = useState<GameDto[]>([]);
    const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());
    const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set());
    const [ownedIds, setOwnedIds] = useState<Set<number>>(new Set());
    const [activeIds, setActiveIds] = useState<Set<number>>(new Set());
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const refresh = () => {
        setLoading(true);
        Promise.all([
            gameApi.listOpen(),
            gameApi.listMyActive(),
            gameApi.listMyRegistered(),
            gameApi.listMyInvited(),
            gameApi.listMyOwned()
        ]).then(([open, active, registered, invited, owned]) => {
            setInvitedIds(new Set(invited.map(g => g.id)));
            setRegisteredIds(new Set(registered.map(g => g.id)));
            setOwnedIds(new Set(owned.map(g => g.id)));
            setActiveIds(new Set(active.map(g => g.id)));

            const all = [...open, ...active, ...registered, ...invited, ...owned];
            const seen = new Set<number>();
            const unique = all.filter(g => {
                if (seen.has(g.id)) return false;
                seen.add(g.id);
                return true;
            });
            unique.sort((a, b) => b.id - a.id);
            setGames(unique);
            setLoadError(null);
        }).catch(e => {
            setLoadError(String(e));
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        return subscribeToLobby(() => {
            refresh();
        });
    }, [subscribeToLobby]);

    const selectedGame = games.find(g => g.id === selectedId);

    const handleSelect = (game: GameDto) => {
        setSelectedId(game.id);
    };

    return (
        <AppLayout background={"/Locations76.jpg"}>
            {!authLoading && user && (
                <MasterDetailView
                    columns="320px 1fr"
                    activeKey={selectedId != null ? 'details' : 'list'}
                    panels={[
                        {
                            key: 'list',
                            label: 'Game List',
                            content: (
                                <GameListPanel
                                    games={games}
                                    invitedIds={invitedIds}
                                    registeredIds={registeredIds}
                                    ownedIds={ownedIds}
                                    activeIds={activeIds}
                                    selectedId={selectedId}
                                    currentUsername={user.username}
                                    onSelect={handleSelect}
                                    onCreate={() => setShowCreate(true)}
                                    loading={loading}
                                    loadError={loadError ?? undefined}
                                />
                            )
                        },
                        {
                            key: 'details',
                            label: selectedGame ? `Game: ${selectedGame.name}` : 'Game Details',
                            content: (
                                selectedId !== null && selectedGame ? (
                                    <GameDetailsPanel
                                        key={selectedId}
                                        game={selectedGame}
                                        currentUsername={user.username}
                                        onChanged={refresh}
                                    />
                                ) : (
                                    <div className="h-full bg-surface/70 backdrop-blur-md border border-line/75 rounded-lg flex items-center justify-center shadow-lg">
                                        <EmptyState
                                            icon={Gamepad2}
                                            title="No game selected"
                                            description="Choose a game from the list to see details and join the action."
                                        />
                                    </div>
                                )
                            )
                        }
                    ]}
                />
            )}

            {showCreate && (
                <CreateGameModal
                    onCreated={() => { setShowCreate(false); refresh(); }}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </AppLayout>
    );
}
