import {useState} from 'react';
import {RotateCcw, Trash2} from 'lucide-react';

interface Props {
    saveLabel?:   string;
    saveError?:   boolean;
    onRetrySave?: () => void;
    onDelete?:    () => void;
}

export default function DeckHeaderControls({ saveLabel, saveError, onRetrySave, onDelete }: Props) {
    const [confirmDel, setConfirmDel] = useState(false);

    return (
        <div className="flex items-center gap-2">
            {saveError ? (
                <>
                    <span className="text-[10px] text-blood-soft">Save failed</span>
                    {onRetrySave && (
                        <button
                            onClick={onRetrySave}
                            title="Retry save"
                            className="p-1 rounded hover:bg-blood/10 text-blood-soft hover:text-blood transition-colors cursor-pointer"
                        >
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </>
            ) : saveLabel ? (
                <span className="text-[10px] text-ink-muted">{saveLabel}</span>
            ) : null}

            {onDelete && (
                confirmDel ? (
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-blood-soft">Delete?</span>
                        <button
                            onClick={() => { setConfirmDel(false); onDelete(); }}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blood/15 text-blood-soft hover:bg-blood/25 transition-colors cursor-pointer"
                        >
                            Yes
                        </button>
                        <button
                            onClick={() => setConfirmDel(false)}
                            className="text-[10px] px-1.5 py-0.5 rounded hover:bg-hover text-ink-muted transition-colors cursor-pointer"
                        >
                            No
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmDel(true)}
                        title="Delete deck"
                        className="p-1.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )
            )}
        </div>
    );
}
