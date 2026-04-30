import {useEffect, useState} from 'react';
import {CheckCircle2, LogOut, UserPlus} from 'lucide-react';
import Button from '@/shared/components/Button';
import Spinner from '@/shared/components/Spinner';
import type {Deck} from '@/features/deck/types';
import type {Tournament, TournamentRegistration} from './types';
import tournamentApi from './api';
import deckApi from '@/features/deck/api';
import {useAuthContext} from '@/contexts/AuthContext';

interface Props {
    tournament: Tournament;
    onChanged: () => void;
}

export default function TournamentRegistrationPanel({tournament, onChanged}: Props) {
    const {user} = useAuthContext();
    const [myRegistration, setMyRegistration] = useState<TournamentRegistration | null>(null);
    const [allRegistrations, setAllRegistrations] = useState<TournamentRegistration[]>([]);
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmLeave, setConfirmLeave] = useState(false);

    const isWithinRegistrationWindow = () => {
        const now = new Date();
        if (tournament.registrationStart && now < new Date(tournament.registrationStart)) return false;
        if (tournament.registrationEnd && now > new Date(tournament.registrationEnd)) return false;
        return true;
    };

    const deckCount = tournament.format === 'SINGLE_DECK' ? 1 : tournament.numberOfRounds;

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const [regs, decks] = await Promise.all([
                    tournamentApi.getRegistrations(tournament.id),
                    deckApi.list({format: tournament.gameFormat}),
                ]);
                setAllRegistrations(regs);
                setMyRegistration(regs.find(r => r.username === user?.username) ?? null);
                setAvailableDecks(decks);
                setSelectedDeckIds(Array(deckCount).fill(''));
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [tournament.id]);

    const handleRegister = async () => {
        if (selectedDeckIds.some(id => !id)) {
            setError(`Please select ${deckCount} deck${deckCount > 1 ? 's' : ''}`);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const reg = await tournamentApi.register(tournament.id, selectedDeckIds);
            setMyRegistration(reg);
            setAllRegistrations(prev => [...prev, reg]);
            onChanged();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to register');
        } finally {
            setSaving(false);
        }
    };

    const handleLeave = async () => {
        setSaving(true);
        setError(null);
        try {
            await tournamentApi.unregister(tournament.id);
            setMyRegistration(null);
            setAllRegistrations(prev => prev.filter(r => r.id !== myRegistration?.id));
            setConfirmLeave(false);
            onChanged();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to leave tournament');
        } finally {
            setSaving(false);
        }
    };

    const canRegister = isWithinRegistrationWindow();

    if (loading) {
        return <Spinner message="Loading tournament..." />;
    }

    return (
        <div className="space-y-6">
            {/* My Registration */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <UserPlus className="w-3 h-3"/> My Registration
                </h3>

                {myRegistration ? (
                    <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-online">
                            <CheckCircle2 className="w-4 h-4"/>
                            <span className="text-sm font-medium">Registered</span>
                        </div>
                        <div className="space-y-1">
                            {myRegistration.decks.map((d, i) => (
                                <div key={i} className="flex justify-between text-xs">
                                    <span className="text-ink-muted">
                                        {tournament.format === 'MULTI_DECK' ? `Round ${i + 1}:` : 'Deck:'}
                                    </span>
                                    <span className="text-ink font-medium">{d.deckName}</span>
                                </div>
                            ))}
                        </div>
                        {canRegister && (
                            <div className="pt-1">
                                {confirmLeave ? (
                                    <div className="flex items-center gap-2 bg-blood/10 px-3 py-2 rounded-lg">
                                        <span className="text-xs text-blood-soft font-bold uppercase flex-1">Leave tournament?</span>
                                        <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(false)}>No</Button>
                                        <Button variant="ghost" size="sm" onClick={handleLeave} disabled={saving}>Yes, leave</Button>
                                    </div>
                                ) : (
                                    <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
                                        <LogOut className="w-3 h-3 mr-1"/> Leave Tournament
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : canRegister ? (
                    <div className="bg-hover/20 border border-line/30 rounded-lg p-4 space-y-4">
                        <p className="text-xs text-ink-muted">
                            {tournament.format === 'SINGLE_DECK'
                                ? 'Select a deck to register for this tournament.'
                                : `Select ${deckCount} decks — one per round.`}
                        </p>
                        <div className="space-y-2">
                            {Array.from({length: deckCount}, (_, i) => (
                                <div key={i}>
                                    {tournament.format === 'MULTI_DECK' && (
                                        <label className="block text-[10px] text-ink-muted uppercase font-bold mb-1">
                                            Round {i + 1} Deck
                                        </label>
                                    )}
                                    <select
                                        value={selectedDeckIds[i] ?? ''}
                                        onChange={e => {
                                            const ids = [...selectedDeckIds];
                                            ids[i] = e.target.value;
                                            setSelectedDeckIds(ids);
                                        }}
                                        className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink outline-none"
                                    >
                                        <option value=''>— Select a deck —</option>
                                        {availableDecks.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                        {error && <p className="text-xs text-blood">{error}</p>}
                        <Button variant="accent-ghost" size="sm" onClick={handleRegister} disabled={saving}>
                            {saving ? 'Registering…' : 'Register for Tournament'}
                        </Button>
                    </div>
                ) : (
                    <div className="bg-hover/20 border border-line/30 rounded-lg p-4">
                        <p className="text-sm text-ink-muted italic">
                            {tournament.registrationEnd && new Date() > new Date(tournament.registrationEnd)
                                ? 'Registration has closed.'
                                : 'Registration has not started yet.'}
                        </p>
                    </div>
                )}
            </section>

            {/* Registered Players */}
            <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                    Registered Players ({allRegistrations.length})
                </h3>
                {allRegistrations.length === 0 ? (
                    <p className="text-sm text-ink-muted italic">No players registered yet.</p>
                ) : (
                    <div className="bg-hover/10 rounded-xl border border-line/30 overflow-hidden divide-y divide-line/20">
                        {allRegistrations.map(r => (
                            <div key={r.id} className="px-4 py-2">
                                <span className="text-sm text-ink">{r.username}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
