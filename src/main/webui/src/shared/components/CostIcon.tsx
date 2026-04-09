interface CostIconProps {
    type: 'blood' | 'pool';
    amount?: string | number;
    size?: number;
    title?: string;
    className?: string;
}

export function CostIcon({ type, amount, size = 24, title, className }: CostIconProps) {
    if (!type) return null;

    const normalizedType = type.toLowerCase();
    const normalizedAmount = amount !== undefined ? String(amount).toLowerCase() : '';
    
    // Logic for filename:
    // 1. type + amount (e.g., blood4.svg, poolx.svg)
    // 2. If amount is empty, fallback to type + "cost" (e.g., bloodcost.svg, poolcost.svg)
    
    let filename = normalizedAmount ? `${normalizedType}${normalizedAmount}` : `${normalizedType}cost`;
    let src = `/svg/cost/${filename}.svg`;

    const fallbackSrc = `/svg/cost/${normalizedType}cost.svg`;

    return (
        <img
            src={src}
            alt={`${type} cost ${amount || ''}`}
            title={title || `${amount || ''} ${type}`}
            width={size}
            height={size}
            className={`inline-block align-middle ${className || ''}`}
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== new URL(fallbackSrc, window.location.origin).href) {
                    target.src = fallbackSrc;
                } else {
                    target.style.display = 'none';
                }
            }}
        />
    );
}
