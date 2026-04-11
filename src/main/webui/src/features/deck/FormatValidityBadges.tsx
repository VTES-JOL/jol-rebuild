import {useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, Minus, X} from 'lucide-react';
import deckApi from './api';

const FORMATS = [
    {key: 'STANDARD', label: 'Standard'},
    {key: 'DUEL',     label: 'Duel'},
    {key: 'V5',       label: 'V5'},
] as const;

type FormatKey = (typeof FORMATS)[number]['key'];

interface Props {
    deckId: number;
    formatValidity: Record<string, boolean>;
    className?: string;
}

interface ModalState {
    format: FormatKey;
    label: string;
    errors: string[] | null; // null = loading
}

export default function FormatValidityBadges({deckId, formatValidity, className = ''}: Props) {
    const [modal,  setModal]  = useState<ModalState | null>(null);
    const [cache,  setCache]  = useState<Partial<Record<FormatKey, string[]>>>({});

    const handleClick = async (e: React.MouseEvent, key: FormatKey, label: string) => {
        e.stopPropagation();
        if (formatValidity[key] !== false) return; // only invalid badges open modal

        if (cache[key]) {
            setModal({format: key, label, errors: cache[key]!});
            return;
        }

        setModal({format: key, label, errors: null});
        try {
            const result = await deckApi.validity(deckId, key);
            setCache(prev => ({...prev, [key]: result.errors}));
            setModal({format: key, label, errors: result.errors});
        } catch {
            setCache(prev => ({...prev, [key]: []}));
            setModal({format: key, label, errors: []});
        }
    };

    const closeModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setModal(null);
    };

    return (
        <div className={className}>
            <div className="flex items-center gap-1.5">
                {FORMATS.map(({key, label}) => {
                    const status = formatValidity[key]; // true | false | undefined
                    const isInvalid = status === false;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={e => handleClick(e, key, label)}
                            className={[
                                'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
                                status === true  ? 'bg-online/15 text-online cursor-default' :
                                isInvalid        ? 'bg-blood/15 text-blood-soft hover:bg-blood/25 cursor-pointer' :
                                                   'bg-hover text-ink-muted cursor-default',
                            ].join(' ')}
                        >
                            {status === true  ? <Check className="w-2.5 h-2.5" /> :
                             isInvalid        ? <X className="w-2.5 h-2.5" /> :
                                               <Minus className="w-2.5 h-2.5" />}
                            {label}
                        </button>
                    );
                })}
            </div>

            {modal && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="relative flex flex-col w-full max-w-sm rounded-lg border border-line/75 bg-surface shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-line/75 bg-panel/45">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-medium text-ink tracking-wide">{modal.label}</h2>
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blood/15 text-blood-soft text-[10px] font-medium">
                                    <X className="w-2.5 h-2.5" />
                                    Invalid
                                </span>
                            </div>
                            <button onClick={closeModal} className="p-1 rounded hover:bg-hover transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-ink-muted" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-4 py-3 min-h-[60px]">
                            {modal.errors === null ? (
                                <p className="text-xs text-ink-muted animate-pulse">Loading…</p>
                            ) : modal.errors.length === 0 ? (
                                <p className="text-xs text-ink-muted">No details available.</p>
                            ) : (
                                <ul className="space-y-1.5">
                                    {modal.errors.map((err, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-blood-soft">
                                            <span className="mt-px shrink-0 text-blood/60">·</span>
                                            <span>{err}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end px-4 py-3 border-t border-line/75">
                            <button
                                onClick={closeModal}
                                className="text-xs px-3 py-1.5 rounded border border-line/60 text-ink-muted hover:text-ink hover:bg-hover transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
