import {useEffect, useState} from "react";
import {Swords} from "lucide-react";
import Panel from "@/shared/components/Panel";
import EmptyState from "@/shared/components/EmptyState";
import gameApi, {type GameDto} from "@/features/game/api";
import {Link} from "react-router-dom";

export default function ActiveGames() {
    const [active, setActive] = useState<GameDto[]>([]);
    const [error,  setError]  = useState(false);

    useEffect(() => {
        gameApi.listMyActive()
            .then(a => setActive(a))
            .catch(() => setError(true));
    }, []);

    return (
        <Panel title="Active Games" right={<span className="text-[10px] tabular-nums text-ink-muted">{active.length} Total</span>}>
            <div className="flex-1 overflow-y-auto min-h-0">
                {error && <EmptyState title="Failed to load games." className="text-blood-soft" />}

                {active.length > 0 && (
                    <div>
                        <div className="px-3 py-1 bg-panel border-y border-line/50 text-[10px] font-semibold text-ink uppercase tracking-wider">
                            In Progress
                        </div>
                        {active.map(g => <GameItem key={g.id} game={g} />)}
                    </div>
                )}

                {!error && active.length === 0 && (
                    <EmptyState
                        icon={Swords}
                        title="No active games."
                        action={
                            <Link to="/lobby" className="text-xs text-accent-soft hover:text-accent transition-colors">
                                Find a game →
                            </Link>
                        }
                    />
                )}
            </div>
        </Panel>
    );
}

function GameItem({ game }: { game: GameDto }) {
    return (
        <Link 
            to={`/game/${game.id}`}
            className="flex items-center justify-between px-4 py-2 border-b border-line/40 hover:bg-hover/50 transition-colors group"
        >
            <div className="min-w-0">
                <div className="text-sm font-medium text-ink group-hover:text-accent-soft truncate">
                    {game.name}
                </div>
                <div className="text-[10px] text-ink-muted">
                    {game.format} · {game.owner}
                </div>
            </div>
            <div className="text-[10px] text-online opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">
                Join
            </div>
        </Link>
    );
}