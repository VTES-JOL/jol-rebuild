import {Layers} from 'lucide-react';
import type {Condition, Rule} from './types';

interface Props {
    rules: Rule[];
    conditions?: Condition[];
}

export default function TournamentRulesList({rules, conditions}: Props) {
    return (
        <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <Layers className="w-3 h-3"/> Tournament Rules
            </h3>
            <div className="bg-hover/10 rounded-xl border border-line/30 overflow-hidden divide-y divide-line/20">
                {rules.length > 0 ? (
                    rules.map((rule, idx) => {
                        const condition = conditions?.find(c => c.id === rule.conditionId);
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
    );
}
