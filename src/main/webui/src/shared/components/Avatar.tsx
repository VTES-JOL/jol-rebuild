import {avatarStyle, initials} from '@/shared/utils/avatarUtils';

interface Props {
    username: string;
    size?: 'sm' | 'md';
    className?: string;
}

const SIZE_CLASSES = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-8 h-8 text-sm',
};

export default function Avatar({username, size = 'md', className = ''}: Props) {
    return (
        <div
            className={`rounded-full flex items-center justify-center font-medium shrink-0 ${SIZE_CLASSES[size]} ${className}`}
            style={avatarStyle(username)}
        >
            {initials(username)}
        </div>
    );
}
