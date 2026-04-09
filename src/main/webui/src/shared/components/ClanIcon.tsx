interface ClanIconProps {
    clan: string;
    size?: number;
    title?: string;
    className?: string;
}

export function ClanIcon({ clan, size = 24, title, className }: ClanIconProps) {
    if (!clan) return null;

    // The clan string on the card needs to be converted to lowercase and the spaces removed in order to map to a SVG file.
    const filename = clan.toLowerCase().replace(/\s+/g, '');
    const src = `/svg/clan/${filename}.svg`;

    return (
        <img
            src={src}
            alt={clan}
            title={title || clan}
            width={size}
            height={size}
            className={`inline-block align-middle ${className || ''}`}
        />
    );
}
