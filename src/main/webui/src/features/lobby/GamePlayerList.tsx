import {Check, Users} from 'lucide-react';
import type {InviteInfo, RegistrationInfo} from '@/features/game/api';

interface Props {
    registrations: RegistrationInfo[];
    invites: InviteInfo[];
    currentUsername: string;
    gameOwner: string | null;
    loading: boolean;
}

export default function GamePlayerList({registrations, invites, currentUsername, gameOwner, loading}: Props) {
    return (
        <>
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 px-1">
                    <Users className="w-4 h-4 text-ink-muted" />
                    Registered Players
                </h3>
                <div className="border border-line/40 rounded-lg divide-y divide-line/40">
                    {loading ? (
                        <div className="p-4 text-center text-xs text-ink-muted italic">Loading players…</div>
                    ) : registrations.length === 0 ? (
                        <div className="p-4 text-center text-xs text-ink-muted italic">No players registered yet.</div>
                    ) : (
                        registrations.map(r => (
                            <div key={r.username} className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-online shrink-0" />
                                    <span className={`text-sm ${r.username === currentUsername ? 'font-bold text-accent-soft' : 'text-ink'}`}>
                                        {r.username}
                                        {r.username === gameOwner && (
                                            <span className="ml-1.5 text-[10px] text-gold font-normal">(host)</span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {invites.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-ink flex items-center gap-2 px-1">
                        <Users className="w-4 h-4 text-ink-muted" />
                        Invited Players
                    </h3>
                    <div className="border border-line/40 rounded-lg divide-y divide-line/40 opacity-70">
                        {invites.map(r => (
                            <div key={r.username} className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 shrink-0" />
                                    <span className={`text-sm ${r.username === currentUsername ? 'font-bold text-accent-soft' : 'text-ink'}`}>
                                        {r.username}
                                    </span>
                                </div>
                                <span className="text-[10px] text-ink-muted italic">invited</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
