interface DisciplineIconProps {
    discipline: string;
    size?: number;
    title?: string;
    className?: string;
}

export function DisciplineIcon({ discipline, size = 24, title, className }: DisciplineIconProps) {
    if (!discipline) return null;

    const isSuperior = discipline === discipline.toUpperCase() && discipline !== discipline.toLowerCase();

    // Path logic: /svg/disc/{inf|sup}/{code}.svg

    const folder = isSuperior ? 'sup' : 'inf';
    const filename = isSuperior ? discipline : discipline.toLowerCase();
    
    const src = `/svg/disc/${folder}/${filename}.svg`;

    return (
        <img
            src={src}
            alt={discipline}
            title={title || discipline}
            width={size}
            height={size}
            className={`inline-block align-middle ${className || ''}`}
        />
    );
}
