import {Trash2} from 'lucide-react';
import Button from '@/shared/components/Button';
import type {Condition, Rule, Tournament} from './types';

interface Props {
    editData: Tournament;
    onDataChange: (updated: Tournament) => void;
}

function toUTCISO(dateStr: string | undefined, field: string): string {
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
}

export default function TournamentEditForm({editData, onDataChange}: Props) {
    const updateField = <K extends keyof Tournament>(field: K, value: Tournament[K]) => {
        onDataChange({...editData, [field]: value});
    };

    const handleDateChange = (field: keyof Tournament, value: string) => {
        if (!value) { updateField(field, undefined as Tournament[typeof field]); return; }
        updateField(field, new Date(value + ':00Z').toISOString() as Tournament[typeof field]);
    };

    const addRule = () => updateField('rules', [...(editData.rules || []), {text: '', conditionId: ''}]);
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
    const addCondition = () => updateField('conditions', [...(editData.conditions || []), {id: crypto.randomUUID(), text: ''}]);
    const removeCondition = (id: string) => {
        updateField('conditions', (editData.conditions || []).filter(c => c.id !== id));
        updateField('rules', (editData.rules || []).map(r => r.conditionId === id ? {...r, conditionId: ''} : r));
    };
    const updateCondition = (index: number, condition: Condition) => {
        const conditions = [...(editData.conditions || [])];
        conditions[index] = condition;
        updateField('conditions', conditions);
    };

    return (
        <div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">General Settings</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-ink-muted mb-1 ml-1">Tournament Format</label>
                                    <select value={editData.format} onChange={e => updateField('format', e.target.value as Tournament['format'])}
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
                                            {(editData.conditions || []).map((c: Condition) => (
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
}
