import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Kirutma render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
          <p className="text-[14px] font-semibold text-text-primary">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </p>
          <p className="max-w-md text-[11px] text-text-muted">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-[12px] text-white hover:bg-accent-hover"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
