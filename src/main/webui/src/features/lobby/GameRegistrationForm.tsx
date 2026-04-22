import {useState} from 'react';
import {Shield} from 'lucide-react';
import Button from '@/shared/components/Button';
import gameApi, {type RegistrationInfo} from '@/features/game/api';
import type {Deck} from '@/features/deck/types';

interface Props {
    gameId: string;
    myRegistration: RegistrationInfo | undefined;
    isInvited: boolean;
    isFull: boolean;
    myDecks: Deck[];
    onChanged?: () => void;
    onDetailRefresh: () => void;
}

export default function GameRegistrationForm({
    gameId, myRegistration, isInvited, isFull, myDecks, onChanged, onDetailRefresh,
}: Props) {
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const isRegistered = !!myRegistration;

    const handleRegister = async () => {
        if (!selectedDeckId) return;
        setError(null);
        try {
            await gameApi.registerForGame(gameId, selectedDeckId);
            onChanged?.();
            onDetailRefresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to join game');
        }
    };

    const handleLeave = async () => {
        setError(null);
        try {
            await gameApi.leaveGame(gameId);
            onChanged?.();
            onDetailRefresh();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to leave game');
        }
    };

    return (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent-soft" />
                {isRegistered ? 'Your Registration' : 'Join Game'}
            </h3>

            {isRegistered ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-ink-muted">Registered deck:</div>
                            <div className="text-sm font-medium text-accent-soft">
                                {myRegistration.deckName || 'No deck selected'}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleLeave}>Leave Game</Button>
                    </div>
                    {error && <p className="text-xs text-blood" role="alert">{error}</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs text-ink-soft leading-relaxed">
                        {isInvited
                            ? "You've been invited to this game. Select a deck to join."
                            : "This is an open game. You can join by selecting one of your decks."}
                    </p>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 bg-panel border border-line rounded px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                            value={selectedDeckId}
                            onChange={e => setSelectedDeckId(e.target.value)}
                        >
                            <option value="">Select a deck…</option>
                            {myDecks.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                        <Button
                            variant="secondary"
                            disabled={!selectedDeckId || isFull}
                            onClick={handleRegister}
                        >
                            Join
                        </Button>
                    </div>
                    {isFull && (
                        <p className="text-[10px] text-blood-soft font-medium">This game is currently full.</p>
                    )}
                    {error && <p className="text-xs text-blood" role="alert">{error}</p>}
                </div>
            )}
        </div>
    );
}
