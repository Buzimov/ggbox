import { Component, type ErrorInfo, type ReactNode } from 'react';
import { trackEvent } from './analytics';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    trackEvent('app_error_captured', {
      message: error.message,
      component_stack: info.componentStack?.slice(0, 600) ?? null,
    });
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#03060a] px-4 text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 18%, rgba(84,185,255,0.20), transparent 28%), linear-gradient(135deg, #03060a 0%, #07111b 54%, #030406 100%)',
          }}
        />
        <section className="relative z-10 w-full max-w-xl border border-white/14 bg-black/52 p-6 shadow-[0_0_70px_rgba(84,185,255,0.14)]" style={{ borderRadius: 8 }}>
          <div className="text-xs font-black uppercase text-[#54b9ff]" style={{ letterSpacing: '0.16em' }}>GGBOX</div>
          <h1 className="mt-4 text-4xl font-black leading-tight">Something went wrong</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/58">
            Refresh the page or return to the market. The error was captured locally for QA review.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-11 items-center justify-center border border-[#54b9ff] bg-[#315eff] px-4 text-xs font-black uppercase text-white"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
            >
              Refresh
            </button>
            <a
              href="/market"
              className="flex h-11 items-center justify-center border border-white/14 bg-white/[0.05] px-4 text-xs font-black uppercase text-white no-underline"
              style={{ borderRadius: 8, letterSpacing: '0.12em' }}
            >
              Market
            </a>
          </div>
        </section>
      </main>
    );
  }
}
