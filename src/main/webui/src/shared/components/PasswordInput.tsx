import type {InputHTMLAttributes} from 'react';
import {useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import Input from './Input';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
    label?: string;
    srLabel?: string;
    error?: string;
    hint?: string;
    size?: 'sm' | 'md';
};

export default function PasswordInput({...props}: PasswordInputProps) {
    const [show, setShow] = useState(false);
    return (
        <Input
            {...props}
            type={show ? 'text' : 'password'}
            right={
                <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="text-ink-muted hover:text-ink"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            }
        />
    );
}
