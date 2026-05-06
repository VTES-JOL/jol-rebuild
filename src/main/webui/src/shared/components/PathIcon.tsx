interface PathIconProps {
    path: string;
    size?: number;
    title?: string;
    className?: string;
}

export function PathIcon({ path, size = 24, title, className }: PathIconProps) {
    if (!path) return null;

    // The conversion for Path is just the first word in the path string converted to lowercase
    const firstWord = path.split(/\s+/)[0].toLowerCase();
    const src = `/svg/path/${firstWord}.svg`;

    return (
        <img
            src={src}
            alt={path}
            title={title || path}
            width={size}
            height={size}
            className={`inline-block align-middle ${className || ''}`}
        />
    );
}
