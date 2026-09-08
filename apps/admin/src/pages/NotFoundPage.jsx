import { adminPaths } from "../app/routePaths.js";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/FeedbackStates.jsx";

/** Renders the protected admin fallback for unknown routes. */
export function NotFoundPage() {
  return <div className="py-16"><EmptyState title="Admin page not found" message="The address does not match a Cycle 1 administration route." action={<Button to={adminPaths.dashboard}>Return to dashboard</Button>} /></div>;
}
