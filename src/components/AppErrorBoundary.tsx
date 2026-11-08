import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    console.error('StudyQuest UI error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#121212] text-gray-200 flex items-center justify-center p-6">
        <section className="w-full max-w-xl rounded-2xl border border-red-400/20 bg-white/5 p-6">
          <h1 className="text-xl font-bold">StudyQuest</h1>
          <p className="text-sm text-gray-400 mt-2">
            Something went wrong in the interface.
          </p>

          <pre className="mt-4 overflow-auto rounded-xl border border-red-400/20 bg-black/40 p-4 text-left text-xs text-red-200 whitespace-pre-wrap">
            {this.state.message || 'Unknown runtime error'}
          </pre>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
