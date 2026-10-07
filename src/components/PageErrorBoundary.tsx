import { Component, createRef, type ReactNode } from 'react';

export default class PageErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  private headingRef = createRef<HTMLHeadingElement>();

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.headingRef.current?.focus();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-dvh place-items-center bg-canvas px-6 py-12 text-ink">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-outline-variant bg-card-base p-6 sm:p-8">
          <h1 ref={this.headingRef} tabIndex={-1} className="text-2xl font-semibold text-balance sm:text-3xl">
            La pagina non è disponibile
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-text text-pretty">
            Non è stato possibile aprire questa pagina. Ricaricala per riprovare e ricevere gli ultimi aggiornamenti.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-canvas transition-colors duration-150 hover:bg-ink-soft"
          >
            Ricarica pagina
          </button>
        </section>
      </main>
    );
  }
}
