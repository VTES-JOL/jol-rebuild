import {useEffect, useState} from 'react';
import {ChevronDown, Gamepad2} from 'lucide-react';
import AppLayout from "@/shared/layout/AppLayout.tsx";
import {useAuthContext} from "@/hooks/useAuthContext.ts";
import {useLobbySocket} from "./LobbySocketContext.tsx";
import gameApi, {type GameDto} from '@/features/game/api';
import GameListPanel from './GameListPanel';
import GameDetailsPanel from './GameDetailsPanel';
import CreateGameModal from './CreateGameModal';
import EmptyState from '@/shared/components/EmptyState';

export default function LobbyPage() {
    const {user, loading: authLoading} = useAuthContext();
    const {subscribeToLobby} = useLobbySocket();
    
    const [games, setGames] = useState<GameDto[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const refresh = () => {
        setLoading(true);
        Promise.all([
            gameApi.listOpen(),
            gameApi.listMyActive(),
            gameApi.listMyRegistered(),
            gameApi.listMyInvited(),
            gameApi.listMyOwned()
        ]).then(([open, active, registered, invited, owned]) => {
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
        setMobileNavOpen(false);
    };

    return (
        <AppLayout background={"/Locations76.jpg"}>
            {!authLoading && user && (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Mobile Dropdown Selector */}
                    <div className="md:hidden mb-4 shrink-0">
                        <button
                            onClick={() => setMobileNavOpen(!mobileNavOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-panel border border-line rounded-lg text-sm font-semibold text-ink shadow-sm"
                        >
                            <span className="truncate">
                                {selectedGame ? selectedGame.name : 'Select a game…'}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${mobileNavOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {mobileNavOpen && (
                            <div className="mt-2 bg-panel border border-line rounded-lg shadow-xl overflow-hidden z-10 relative max-h-[60vh] flex flex-col">
                                <GameListPanel
                                    games={games}
                                    selectedId={selectedId}
                                    currentUsername={user.username}
                                    onSelect={handleSelect}
                                    onCreate={() => { setShowCreate(true); setMobileNavOpen(false); }}
                                    loading={loading}
                                    loadError={loadError ?? undefined}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] grid-rows-1 gap-6 flex-1 min-h-0">
                        <div className="hidden md:block">
                            <GameListPanel
                                games={games}
                                selectedId={selectedId}
                                currentUsername={user.username}
                                onSelect={handleSelect}
                                onCreate={() => setShowCreate(true)}
                                loading={loading}
                                loadError={loadError ?? undefined}
                            />
                        </div>

                        <div className="flex-1 min-h-0">
                            {selectedId !== null && selectedGame ? (
                                <GameDetailsPanel
                                    key={selectedId}
                                    game={selectedGame}
                                    currentUsername={user.username}
                                    onChanged={refresh}
                                />
                            ) : (
                                <div className="h-full bg-panel/40 backdrop-blur-sm border border-line/50 rounded-lg flex items-center justify-center">
                                    <EmptyState
                                        icon={Gamepad2}
                                        title="No game selected"
                                        description="Choose a game from the list to see details and join the action."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
