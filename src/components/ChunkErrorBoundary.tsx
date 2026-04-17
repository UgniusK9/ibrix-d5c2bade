import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches "Failed to fetch dynamically imported module" errors that happen
 * when the app has been redeployed and the browser is holding stale chunk
 * references. Auto-reloads once to fetch the fresh module graph.
 */
export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("error loading dynamically imported module");

    if (isChunkError && typeof window !== "undefined") {
      const KEY = "chunk-reload-attempted";
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, "1");
        window.location.reload();
        return { hasError: true };
      }
    }
    return { hasError: true };
  }

  componentDidCatch() {
    // no-op; reload handled in getDerivedStateFromError
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="text-center space-y-4 max-w-sm">
            <h1 className="text-xl font-semibold">Įvyko klaida</h1>
            <p className="text-sm text-muted-foreground">
              Atnaujinkite puslapį, kad tęstumėte.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem("chunk-reload-attempted");
                window.location.reload();
              }}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Atnaujinti
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
