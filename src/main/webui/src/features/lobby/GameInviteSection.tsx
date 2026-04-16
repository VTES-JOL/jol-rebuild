import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Users} from 'lucide-react';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import gameApi from '@/features/game/api';
import {baseFetch} from '@/shared/api/client.ts';

interface Props {
    gameId: number;
    onDetailRefresh: () => void;
    onChanged?: () => void;
}

export default function GameInviteSection({gameId, onDetailRefresh, onChanged}: Props) {
    const [inviteQuery, setInviteQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const [suggestPos, setSuggestPos] = useState<{top: number; left: number; width: number} | null>(null);
    const [submittingInvite, setSubmittingInvite] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const inviteInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (inviteQuery.trim().length < 2) {
            setSuggestions([]);
            setShowSuggest(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            const res = await baseFetch(`/user/search?q=${encodeURIComponent(inviteQuery)}`, {credentials: 'include'});
            if (res.ok) {
                const names: string[] = await res.json();
                setSuggestions(names);
                if (names.length > 0 && inviteInputRef.current) {
                    const rect = inviteInputRef.current.getBoundingClientRect();
                    setSuggestPos({top: rect.bottom + 4, left: rect.left, width: rect.width});
                    setShowSuggest(true);
                } else {
                    setShowSuggest(false);
                }
            }
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [inviteQuery]);

    const handleInvite = async (username: string) => {
        const name = username.trim();
        if (!name) return;
        setSubmittingInvite(true);
        setError(null);
        try {
            await gameApi.invitePlayer(gameId, name);
            setInviteQuery('');
            setSuggestions([]);
            setShowSuggest(false);
            onDetailRefresh();
            onChanged?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to send invite');
        } finally {
            setSubmittingInvite(false);
        }
    };

    return (
        <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2 px-1">
                <Users className="w-4 h-4 text-ink-muted" />
                Invite Player
            </h3>
            <div className="flex gap-2">
                <Input
                    ref={inviteInputRef}
                    size="sm"
                    srLabel="Username to invite"
                    value={inviteQuery}
                    onChange={e => setInviteQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleInvite(inviteQuery);
                        if (e.key === 'Escape') setShowSuggest(false);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Username…"
                    className="flex-1"
                />
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleInvite(inviteQuery)}
                    disabled={submittingInvite || !inviteQuery.trim()}
                >
                    Invite
                </Button>
            </div>
            {error && <p className="text-xs text-blood" role="alert">{error}</p>}
            {showSuggest && suggestPos && suggestions.length > 0 && createPortal(
                <ul
                    className="fixed z-[9999] rounded border border-line/60 bg-surface shadow-lg overflow-hidden"
                    style={{top: suggestPos.top, left: suggestPos.left, width: suggestPos.width}}
                >
                    {suggestions.map(name => (
                        <li key={name}>
                            <button
                                type="button"
                                onMouseDown={() => handleInvite(name)}
                                className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-hover transition-colors cursor-pointer"
                            >
                                {name}
                            </button>
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </div>
    );
}
