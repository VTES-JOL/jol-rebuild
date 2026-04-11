import {useState} from 'react';
import {X} from 'lucide-react';
import gameApi from '@/features/game/api';

interface Props {
    onCreated: () => void;
    onClose: () => void;
}

const FORMATS = [
    {key: 'STANDARD' as const, label: 'Standard'},
    {key: 'DUEL'     as const, label: 'Duel'},
    {key: 'V5'       as const, label: 'V5'},
];

const VISIBILITIES = [
    {key: 'PUBLIC'  as const, label: 'Public'},
    {key: 'PRIVATE' as const, label: 'Private'},
];

export default function CreateGameModal({onCreated, onClose}: Props) {
    const [name, setName] = useState('');
    const [format, setFormat] = useState<'STANDARD' | 'DUEL' | 'V5'>('STANDARD');
    const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await gameApi.createGame({name: name.trim() || undefined, visibility, format});
            onCreated();
        } catch {
            setError('Failed to create game. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex flex-col w-full max-w-xs rounded-lg border border-line/75 bg-surface shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-line/75 bg-panel/45">
                    <h2 className="text-sm font-medium text-ink tracking-wide">Create Game</h2>
                    <button onClick={onClose} className="p-1 rounded hover:bg-hover transition-colors cursor-pointer">
                        <X className="w-4 h-4 text-ink-muted" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-4 px-4 py-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="game-name" className="block text-xs text-ink-muted mb-2">
                            Name <span className="text-ink-muted/60">(optional)</span>
                        </label>
                        <input
                            id="game-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Leave blank for a random name…"
                            className="w-full rounded border border-line/60 bg-panel/30 px-3 py-1.5 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent/60"
                        />
                    </div>

                    {/* Format */}
                    <fieldset>
                        <legend className="text-xs text-ink-muted mb-2">Format</legend>
                        <div className="flex gap-1.5">
                            {FORMATS.map(f => (
                                <button
                                    key={f.key}
                                    type="button"
                                    onClick={() => setFormat(f.key)}
                                    className={[
                                        'flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border',
                                        format === f.key
                                            ? 'bg-accent/20 text-accent-soft border-accent/40'
                                            : 'bg-hover text-ink-muted border-line/40 hover:text-ink hover:border-line',
                                    ].join(' ')}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    {/* Visibility */}
                    <fieldset>
                        <legend className="text-xs text-ink-muted mb-2">Visibility</legend>
                        <div className="flex gap-1.5">
                            {VISIBILITIES.map(v => (
                                <button
                                    key={v.key}
                                    type="button"
                                    onClick={() => setVisibility(v.key)}
                                    className={[
                                        'flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer border',
                                        visibility === v.key
                                            ? 'bg-accent/20 text-accent-soft border-accent/40'
                                            : 'bg-hover text-ink-muted border-line/40 hover:text-ink hover:border-line',
                                    ].join(' ')}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                        {visibility === 'PRIVATE' && (
                            <p className="text-[10px] text-ink-muted mt-1.5">
                                Players must be invited before they can register.
                            </p>
                        )}
                    </fieldset>

                    {error && <p className="text-xs text-blood">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line/75">
                    <button
                        onClick={onClose}
                        className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="text-xs px-3 py-1.5 rounded bg-accent/80 text-white hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {submitting ? 'Creating…' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
