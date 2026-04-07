import type {Meta} from '@storybook/react-vite';
import {MemoryRouter, Routes, Route} from 'react-router-dom';

import {ProtectedRouteView} from '../shared/components/ProtectedRoute.tsx';
import React, {type JSX} from "react";

const meta = {
    title: 'Shared/ProtectedRoute',
    component: ProtectedRouteView,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ProtectedRouteView>;

export default meta;

function StoryShell({
                        loading,
                        user,
                        children,
                    }: {
    loading: boolean;
    user: unknown | null;
    children: React.ReactNode;
}) {
    return (
        <MemoryRouter initialEntries={['/protected']}>
            <Routes>
                <Route
                    path="/protected"
                    element={
                        <ProtectedRouteView loading={loading} user={user}>
                            {children as JSX.Element}
                        </ProtectedRouteView>
                    }
                />
                <Route path="/login" element={<div className="p-4 text-sm text-slate-300">Login page</div>}/>
            </Routes>
        </MemoryRouter>
    );
}

export const LoadingState: { render: () => React.JSX.Element } = {
    render: () => (
        <StoryShell loading={true} user={null}>
            <div className="p-4 text-sm text-emerald-300">Protected content</div>
        </StoryShell>
    ),
};

export const RedirectedToLogin: { render: () => React.JSX.Element } = {
    render: () => (
        <StoryShell loading={false} user={null}>
            <div className="p-4 text-sm text-emerald-300">Protected content</div>
        </StoryShell>
    ),
};

export const AllowedUser: { render: () => React.JSX.Element } = {
    render: () => (
        <StoryShell loading={false} user={{id: 1, name: 'Alex'}}>
            <div className="p-4 text-sm text-emerald-300">Protected content visible</div>
        </StoryShell>
    ),
};