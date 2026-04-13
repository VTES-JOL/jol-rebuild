import {useContext} from 'react';
import {authContextValue} from './authContextValue';

export function useAuth() {
    const context = useContext(authContextValue);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
