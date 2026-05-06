import {Component, type ErrorInfo, type ReactNode} from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = {hasError: false, error: null};

    static getDerivedStateFromError(error: Error): State {
        return {hasError: true, error};
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
                    <p className="text-lg font-semibold text-ink">Something went wrong</p>
                    <p className="text-sm text-ink-muted max-w-sm">{this.state.error?.message}</p>
                    <button
                        onClick={() => this.setState({hasError: false, error: null})}
                        className="text-sm px-4 py-2 rounded bg-accent/20 text-accent-soft hover:bg-accent/30 transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
