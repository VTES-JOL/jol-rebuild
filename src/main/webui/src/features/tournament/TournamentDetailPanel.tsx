import {useEffect, useRef, useState} from 'react';
import {Calendar, CheckCircle2, CircleX, ExternalLink, Hash, Info, Layers, Pencil, Trash2} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import type {Condition, Rule, Tournament, TournamentGame} from './types';
import tournamentApi from './api';
import TournamentRegistrationPanel from './TournamentRegistrationPanel';
import TournamentSeatingPanel from './TournamentSeatingPanel';

interface Props {
    tournament: Tournament;
    isTournamentAdmin: boolean;
    onChanged: () => void;
    onDelete: () => void;
    initialEdit?: boolean;
}

export default function TournamentDetailPanel({tournament, isTournamentAdmin, onChanged, onDelete, initialEdit}: Props) {
    const [isEditing, setIsEditing] = useState(initialEdit || false);
    const [editData, setEditData] = useState<Tournament>(tournament);
    const [isEditingName, setIsEditingName] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmUnpublish, setConfirmUnpublish] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [activeGames, setActiveGames] = useState<TournamentGame[]>([]);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditData(tournament);
        setIsEditingName(false);
        setConfirmDelete(false);
        setConfirmUnpublish(false);
        if (initialEdit) setIsEditing(true);
    }, [tournament, initialEdit]);

    useEffect(() => {
        if (isEditingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (tournament.status === 'ACTIVE' || tournament.status === 'SEEDING' || tournament.status === 'FINALS' || tournament.status === 'COMPLETED') {
            tournamentApi.getTournamentGames(tournament.id).then(setActiveGames).catch(() => {});
        }
    }, [tournament.id, tournament.status]);

    const canEdit = isTournamentAdmin && tournament.status === 'SETUP';

    const handleSave = async () => {
        try {
            await tournamentApi.update(tournament.id, editData);
            setIsEditing(false);
            onChanged();
        } catch (e) {
            console.error('Failed to update tournament', e);
        }
    };

    const handleTransition = async (action: () => Promise<Tournament>) => {
        setTransitioning(true);
        try {
            await action();
            onChanged();
        } catch (e) {
            console.error('Tournament transition failed', e);
        } finally {
            setTransitioning(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleString();
    };

    const toUTCISO = (dateStr: string | undefined, field: string) => {
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date.toISOString().slice(0, 16);
        }
        const isEnd = field.toLowerCase().includes('end');
        const now = new Date();
        const y = now.getUTCFullYear();
        const mo = String(now.getUTCMonth() + 1).padStart(2, '0');
        const d = String(now.getUTCDate()).padStart(2, '0');
        return isEnd ? `${y}-${mo}-${d}T23:59` : `${y}-${mo}-${d}T00:00`;
    };

    const handleDateChange = (field: keyof Tournament, value: string) => {
        if (!value) { updateField(field, null); return; }
        updateField(field, new Date(value + ':00Z').toISOString());
    };

    const updateField = (field: keyof Tournament, value: any) => {
        setEditData(prev => ({...prev, [field]: value}));
    };

    const addRule = () => {
        updateField('rules', [...(editData.rules || []), {text: '', conditionId: ''}]);
    };
    const removeRule = (index: number) => {
        const rules = [...(editData.rules || [])];
        rules.splice(index, 1);
        updateField('rules', rules);
    };
    const updateRule = (index: number, rule: Rule) => {
        const rules = [...(editData.rules || [])];
        rules[index] = rule;
        updateField('rules', rules);
    };
    const addCondition = () => {
        updateField('conditions', [...(editData.conditions || []), {id: crypto.randomUUID(), text: ''}]);
    };
    const removeCondition = (id: string) => {
        const conditions = (editData.conditions || []).filter(c => c.id !== id);
        updateField('conditions', conditions);
        updateField('rules', (editData.rules || []).map(r => r.conditionId === id ? {...r, conditionId: ''} : r));
    };
    const updateCondition = (index: number, condition: Condition) => {
        const conditions = [...(editData.conditions || [])];
        conditions[index] = condition;
        updateField('conditions', conditions);
    };

    const registrationEndPassed = tournament.registrationEnd
        ? new Date() > new Date(tournament.registrationEnd)
        : false;

    // ─── Status action buttons for admin ──────────────────────────────────────
    const renderAdminActions = () => {
        if (!isTournamentAdmin) return null;

        if (tournament.status === 'SETUP') {
            return (
                <Button variant="accent-ghost" size="sm" disabled={transitioning}
                    onClick={() => handleTransition(() => tournamentApi.publish(tournament.id))}>
                    Publish
                </Button>
            );
        }
        if (tournament.status === 'REGISTRATION') {
            return (
                <div className="flex items-center gap-2">
                    {confirmUnpublish ? (
                        <div className="flex items-center gap-1 bg-blood/10 px-2 py-1 rounded-lg">
                            <span className="text-[10px] text-blood-soft font-bold uppercase">Unpublish & clear?</span>
                            <button onClick={() => handleTransition(() => tournamentApi.unpublish(tournament.id)).then(() => setConfirmUnpublish(false))}
                                className="text-[10px] px-2 py-0.5 rounded bg-blood/20 text-blood hover:bg-blood/30 transition-colors">
                                Yes
                            </button>
                            <button onClick={() => setConfirmUnpublish(false)}
                                className="text-[10px] px-2 py-0.5 rounded hover:bg-hover text-ink-muted transition-colors">
                                No
                            </button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" disabled={transitioning}
                            onClick={() => setConfirmUnpublish(true)}>
                            Unpublish
                        </Button>
                    )}
                    <Button variant="accent-ghost" size="sm"
                        disabled={transitioning || !registrationEndPassed}
                        title={!registrationEndPassed ? 'Registration must have closed first' : undefined}
                        onClick={() => handleTransition(() => tournamentApi.beginSeating(tournament.id))}>
                        Begin Seating
                    </Button>
                </div>
            );
        }
        return null;
    };

    // ─── Contextual content below the fixed info ───────────────────────────────
    const renderContextualContent = () => {
        if (tournament.status === 'REGISTRATION') {
            return (
                <TournamentRegistrationPanel
                    tournament={tournament}
                    onChanged={onChanged}
                />
            );
        }
        if (tournament.status === 'SEATING' && isTournamentAdmin) {
            return (
                <TournamentSeatingPanel
                    tournament={tournament}
                    onActivated={onChanged}
                    onChanged={onChanged}
                />
            );
        }
        if (tournament.status === 'ACTIVE' || tournament.status === 'SEEDING'
            || tournament.status === 'FINALS' || tournament.status === 'COMPLETED') {
            return <ActiveGamesView games={activeGames}/>;
        }
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Player and Table information will appear here once the tournament begins.
            </div>
        );
    };

    const renderDisplay = () => (
        <div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Info className="w-3 h-3"/> Basic Information
                    </h3>
                    <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Status</span>
                            <Badge variant={tournament.status === 'ACTIVE' ? 'online' : 'accent'}>
                                {tournament.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Format</span>
                            <span className="text-sm text-ink">{tournament.format === 'SINGLE_DECK' ? 'Single Deck' : 'Multi Deck'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Game Format</span>
                            <span className="text-sm text-ink">{tournament.gameFormat}</span>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Hash className="w-3 h-3"/> Rules & Settings
                    </h3>
                    <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Number of Rounds</span>
                            <span className="text-sm text-ink font-mono">{tournament.numberOfRounds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Final Round</span>
                            {tournament.finalRound ? <CheckCircle2 className="w-4 h-4 text-online"/> : <CircleX className="w-4 h-4 text-ink-muted"/>}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-ink-muted">Requires ID</span>
                            {tournament.requiresId ? <CheckCircle2 className="w-4 h-4 text-online"/> : <CircleX className="w-4 h-4 text-ink-muted"/>}
                        </div>
                    </div>
                </section>
            </div>

            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Calendar className="w-3 h-3"/> Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-hover/30 rounded-lg p-4">
                        <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Registration Period</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Starts:</span><span className="text-ink">{formatDate(tournament.registrationStart)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Ends:</span><span className="text-ink">{formatDate(tournament.registrationEnd)}</span></div>
                        </div>
                    </div>
                    <div className="bg-hover/30 rounded-lg p-4">
                        <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Playing Period</p>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Starts:</span><span className="text-ink">{formatDate(tournament.playingStart)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-ink-muted">Ends:</span><span className="text-ink">{formatDate(tournament.playingEnd)}</span></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                    <Layers className="w-3 h-3"/> Tournament Rules
                </h3>
                <div className="bg-hover/10 rounded-xl border border-line/30 overflow-hidden divide-y divide-line/20">
                    {tournament.rules && tournament.rules.length > 0 ? (
                        tournament.rules.map((rule, idx) => {
                            const condition = tournament.conditions?.find(c => c.id === rule.conditionId);
                            return (
                                <div key={idx} className="p-3 hover:bg-hover/20 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0"/>
                                        <div className="space-y-1">
                                            <p className="text-sm text-ink leading-tight">{rule.text}</p>
                                            {condition && (
                                                <p className="text-[10px] text-accent-soft font-medium flex items-center gap-1">
                                                    <span className="uppercase tracking-wider">Condition:</span> {condition.text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-ink-muted italic p-4 text-center">No specific rules defined for this tournament.</p>
                    )}
                </div>
            </section>

            <div className="pt-4 border-t border-line/30">
                {renderContextualContent()}
            </div>
        </div>
    );

    const renderEdit = () => (
        <div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">General Settings</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-ink-muted mb-1 ml-1">Tournament Format</label>
                                    <select value={editData.format} onChange={e => updateField('format', e.target.value)}
                                        className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink outline-none">
                                        <option value="SINGLE_DECK">Single Deck</option>
                                        <option value="MULTI_DECK">Multi Deck</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-ink-muted mb-1 ml-1">Game Format</label>
                                    <select value={editData.gameFormat} onChange={e => updateField('gameFormat', e.target.value)}
                                        className="w-full bg-panel border border-line rounded px-3 py-2 text-sm text-ink outline-none">
                                        <option value="STANDARD">Standard</option>
                                        <option value="DUEL">Duel</option>
                                        <option value="V5">V5</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-ink-muted mb-1 ml-1">Number of Rounds (2-3)</label>
                                <input type="number" min="2" max="3" value={editData.numberOfRounds}
                                    onChange={e => updateField('numberOfRounds', parseInt(e.target.value))}
                                    className="w-20 bg-panel border border-line rounded px-3 py-2 text-sm text-ink outline-none"/>
                            </div>
                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={editData.finalRound}
                                        onChange={e => updateField('finalRound', e.target.checked)}
                                        className="w-4 h-4 rounded border-line bg-panel text-accent focus:ring-accent"/>
                                    <span className="text-sm text-ink group-hover:text-accent transition-colors">Final Round</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={editData.requiresId}
                                        onChange={e => updateField('requiresId', e.target.checked)}
                                        className="w-4 h-4 rounded border-line bg-panel text-accent focus:ring-accent"/>
                                    <span className="text-sm text-ink group-hover:text-accent transition-colors">Requires ID</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                            Important Dates
                            <span className="text-[10px] font-normal normal-case tracking-normal text-accent-soft bg-accent/10 px-1.5 py-0.5 rounded">UTC</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {(['registrationStart', 'registrationEnd', 'playingStart', 'playingEnd'] as const).map(field => (
                                <div key={field}>
                                    <label className="block text-xs text-ink-muted mb-1 ml-1">
                                        {field === 'registrationStart' ? 'Registration Start' :
                                         field === 'registrationEnd' ? 'Registration End' :
                                         field === 'playingStart' ? 'Playing Start' : 'Playing End'}
                                    </label>
                                    <input type="datetime-local" value={toUTCISO(editData[field], field)}
                                        onChange={e => handleDateChange(field, e.target.value)}
                                        className="w-full bg-panel border border-line rounded px-3 py-2 text-xs text-ink outline-none"/>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Conditions</h3>
                            <Button variant="accent-ghost" size="sm" onClick={addCondition}>+ New Condition</Button>
                        </div>
                        <div className="space-y-3">
                            {(editData.conditions || []).map((condition, cIdx) => (
                                <div key={condition.id} className="bg-hover/20 border border-line/30 rounded-lg p-3 flex items-center gap-2">
                                    <input type="text" value={condition.text}
                                        onChange={e => updateCondition(cIdx, {...condition, text: e.target.value})}
                                        className="flex-1 bg-transparent border-b border-line text-xs text-ink outline-none py-1"
                                        placeholder="Condition text..."/>
                                    <button onClick={() => removeCondition(condition.id)}
                                        className="text-blood-soft hover:bg-blood/10 p-1 rounded">
                                        <Trash2 className="w-3.5 h-3.5"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Rules</h3>
                            <Button variant="accent-ghost" size="sm" onClick={addRule}>+ New Rule</Button>
                        </div>
                        <div className="space-y-3">
                            {(editData.rules || []).map((rule, rIdx) => (
                                <div key={rIdx} className="bg-panel border border-line rounded-lg p-3 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <textarea value={rule.text}
                                            onChange={e => updateRule(rIdx, {...rule, text: e.target.value})}
                                            className="flex-1 bg-transparent border border-line rounded p-2 text-xs text-ink outline-none h-16 resize-none"
                                            placeholder="Rule text..."/>
                                        <button onClick={() => removeRule(rIdx)}
                                            className="text-blood-soft hover:bg-blood/10 p-1 rounded">
                                            <Trash2 className="w-3.5 h-3.5"/>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-ink-muted uppercase font-bold">Condition:</span>
                                        <select value={rule.conditionId || ''}
                                            onChange={e => updateRule(rIdx, {...rule, conditionId: e.target.value || undefined})}
                                            className="flex-1 bg-panel border border-line rounded px-2 py-1 text-[10px] text-ink outline-none">
                                            <option value="">No Condition</option>
                                            {(editData.conditions || []).map(c => (
                                                <option key={c.id} value={c.id}>{c.text || 'Untitled Condition'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );

    const canEditName = canEdit && isEditing;
    const titleSlot = isEditingName ? (
        <input ref={nameInputRef} value={editData.name}
            onChange={e => updateField('name', e.target.value)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') { updateField('name', tournament.name); setIsEditingName(false); }
            }}
            className="bg-transparent text-ink tracking-wide outline-none border-b border-line-accent w-full max-w-[300px]"/>
    ) : (
        <span onClick={() => canEditName && setIsEditingName(true)}
            className={`tracking-wide text-ink ${canEditName ? 'cursor-pointer group flex items-center gap-2' : ''}`}>
            {editData.name}
            {canEditName && <Pencil className="w-3 h-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </span>
    );

    return (
        <Panel
            title={titleSlot}
            right={
                <div className="flex items-center gap-2">
                    {renderAdminActions()}
                    {canEdit && (
                        <>
                            {isEditing ? (
                                <>
                                    {confirmDelete ? (
                                        <div className="flex items-center gap-1 bg-blood/10 px-2 py-1 rounded-lg">
                                            <span className="text-[10px] text-blood-soft font-bold uppercase">Delete?</span>
                                            <button onClick={onDelete}
                                                className="text-[10px] px-2 py-0.5 rounded bg-blood/20 text-blood hover:bg-blood/30 transition-colors">
                                                Yes
                                            </button>
                                            <button onClick={() => setConfirmDelete(false)}
                                                className="text-[10px] px-2 py-0.5 rounded hover:bg-hover text-ink-muted transition-colors">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmDelete(true)}
                                            className="p-1.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                            title="Delete Tournament">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <div className="h-4 w-[1px] bg-line/50 mx-1"/>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => { setIsEditing(false); setEditData(tournament); setConfirmDelete(false); }}>
                                        Cancel
                                    </Button>
                                    <Button variant="accent-ghost" size="sm" onClick={handleSave}>Save Changes</Button>
                                </>
                            ) : (
                                <Button variant="accent-ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit Tournament
                                </Button>
                            )}
                        </>
                    )}
                </div>
            }
        >
            {isEditing ? renderEdit() : renderDisplay()}
        </Panel>
    );
}

// ─── Active games sub-view ────────────────────────────────────────────────────

function ActiveGamesView({games}: {games: TournamentGame[]}) {
    if (games.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                No games found.
            </div>
        );
    }

    const byRound = games.reduce((acc, g) => {
        (acc[g.roundNumber] = acc[g.roundNumber] || []).push(g);
        return acc;
    }, {} as Record<number, TournamentGame[]>);

    return (
        <div className="space-y-4">
            {Object.entries(byRound).sort(([a], [b]) => Number(a) - Number(b)).map(([round, roundGames]) => (
                <div key={round}>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-ink-muted mb-2">Round {round}</h4>
                    <div className="space-y-2">
                        {roundGames.map(game => (
                            <div key={game.gameId} className="bg-hover/20 border border-line/30 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-ink">{game.gameName}</span>
                                    <a href={`/game/${game.gameId}`}
                                        className="flex items-center gap-1 text-[10px] text-accent hover:text-accent-soft transition-colors">
                                        Join <ExternalLink className="w-3 h-3"/>
                                    </a>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {game.players.map((p, i) => (
                                        <span key={i} className="text-[10px] bg-hover/40 px-2 py-0.5 rounded text-ink-muted">
                                            {p.seatPosition}. {p.username}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
