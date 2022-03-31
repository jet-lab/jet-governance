import { FallbackProps } from "react-error-boundary";

export function AppErrorBanner({ error }: FallbackProps) {
  return (
    <div className="error-page flex-centered column">
      <h1 className="failure-text">Mayday!</h1>
      <p>Sorry, something went wrong.</p>
      <img src="img/ui/failed_init.gif" alt="Failure To Init Gif" />
      <h2 className="failure-text">
        <code>{error.message}</code>
      </h2>
      <div className="error-page-stack">
        <code>{error.stack}</code>
      </div>
    </div>
  );
}
