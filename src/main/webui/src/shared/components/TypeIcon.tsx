interface TypeIconProps {
    type: string;
    size?: number;
    title?: string;
    className?: string;
}

export function TypeIcon({ type, size = 24, title, className }: TypeIconProps) {
    if (!type) return null;

    // The rules are the type string lowercase with spaces removed
    const filename = type.toLowerCase().replace(/\s+/g, '');
    const src = `/svg/type/${filename}.svg`;

    return (
        <img
            src={src}
            alt={type}
            title={title || type}
            width={size}
            height={size}
            className={`inline-block align-middle ${className || ''}`}
        />
    );
}
