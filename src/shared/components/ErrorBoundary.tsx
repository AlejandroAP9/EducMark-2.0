import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-[var(--foreground)] font-medium mb-2">
                        Ocurrió un error inesperado.
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                        {this.state.error?.message}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
