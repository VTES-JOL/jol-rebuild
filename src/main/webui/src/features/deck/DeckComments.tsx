import {useCallback, useEffect, useRef, useState} from 'react';

interface Props {
    comments?:         string | null;
    onCommentsChange?: (comments: string | null) => void;
}

export default function DeckComments({ comments, onCommentsChange }: Props) {
    const [commentValue, setCommentValue] = useState(comments ?? '');
    const commentTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const onCommentsRef   = useRef(onCommentsChange);
    useEffect(() => { onCommentsRef.current = onCommentsChange; });

    const handleChange = useCallback((value: string) => {
        setCommentValue(value);
        clearTimeout(commentTimerRef.current);
        commentTimerRef.current = setTimeout(() => {
            onCommentsRef.current?.(value.trim() || null);
        }, 1500);
    }, []);

    const flushComment = useCallback(() => {
        clearTimeout(commentTimerRef.current);
        const trimmed = commentValue.trim() || null;
        if (trimmed !== (comments ?? null)) onCommentsRef.current?.(trimmed);
    }, [commentValue, comments]);

    return (
        <div className="px-3 py-1.5 border-b border-line/50">
            <textarea
                value={commentValue}
                onChange={e => handleChange(e.target.value)}
                onBlur={flushComment}
                placeholder="Add a note…"
                rows={2}
                className="w-full bg-transparent text-xs text-ink-secondary placeholder:text-ink-muted outline-none resize-none leading-relaxed"
            />
        </div>
    );
}
