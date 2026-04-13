import {useState} from 'react';
import {Calendar, Info, Shield, Hash, Layers, CheckCircle2, AlertCircle} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import type {Tournament} from './types';
import tournamentApi from './api';

interface Props {
    tournament: Tournament;
    isTournamentAdmin: boolean;
    onChanged: () => void;
}

export default function TournamentDetailPanel({tournament, isTournamentAdmin, onChanged}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Tournament>>(tournament);

    const canEdit = isTournamentAdmin && tournament.status === 'Starting';

    const handleSave = async () => {
        try {
            await tournamentApi.update(tournament.id, editData);
            setIsEditing(false);
            onChanged();
        } catch (e) {
            console.error('Failed to update tournament', e);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <Panel
            title={tournament.name}
            right={
                canEdit && (
                    <Button 
                        variant="accent-ghost" 
                        size="sm" 
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    >
                        {isEditing ? 'Save Changes' : 'Edit Tournament'}
                    </Button>
                )
            }
        >
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                            <Info className="w-3 h-3" /> Basic Information
                        </h3>
                        <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-ink-muted">Status</span>
                                <Badge variant={tournament.status === 'Active' ? 'online' : 'accent'}>
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
                            <Hash className="w-3 h-3" /> Rules & Settings
                        </h3>
                        <div className="bg-hover/30 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-ink-muted">Number of Rounds</span>
                                <span className="text-sm text-ink font-mono">{tournament.numberOfRounds}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-ink-muted">Final Round</span>
                                {tournament.finalRound ? 
                                    <CheckCircle2 className="w-4 h-4 text-online" /> : 
                                    <AlertCircle className="w-4 h-4 text-ink-muted" />
                                }
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-ink-muted">Requires ID</span>
                                {tournament.requiresId ? 
                                    <Shield className="w-4 h-4 text-accent" /> : 
                                    <Shield className="w-4 h-4 text-ink-muted" />
                                }
                            </div>
                        </div>
                    </section>
                </div>

                {/* Dates */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Important Dates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-hover/30 rounded-lg p-4">
                            <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Registration Period</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-muted">Starts:</span>
                                    <span className="text-ink">{formatDate(tournament.registrationStart)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-muted">Ends:</span>
                                    <span className="text-ink">{formatDate(tournament.registrationEnd)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-hover/30 rounded-lg p-4">
                            <p className="text-[10px] uppercase font-bold text-ink-muted mb-2">Playing Period</p>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-muted">Starts:</span>
                                    <span className="text-ink">{formatDate(tournament.playingStart)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-muted">Ends:</span>
                                    <span className="text-ink">{formatDate(tournament.playingEnd)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rules List */}
                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Tournament Rules
                    </h3>
                    <div className="space-y-3">
                        {tournament.rules.length > 0 ? (
                            tournament.rules.map((rule, idx) => (
                                <div key={idx} className="bg-hover/30 rounded-lg p-4 border-l-2 border-accent/30">
                                    <p className="text-sm text-ink">{rule.text}</p>
                                    {rule.condition && (
                                        <div className="mt-2 flex items-center gap-2 text-[10px] text-accent-soft italic bg-accent/5 px-2 py-1 rounded">
                                            <span className="font-bold uppercase not-italic">Condition:</span>
                                            {rule.condition}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-ink-muted italic p-4 bg-hover/10 rounded-lg border border-dashed border-line">
                                No specific rules defined for this tournament.
                            </p>
                        )}
                    </div>
                </section>
                
                {/* Placeholder for Players and Tables */}
                <div className="pt-8 border-t border-line/30">
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                        Player and Table information will appear here once the tournament begins.
                    </div>
                </div>
            </div>
        </Panel>
    );
}
