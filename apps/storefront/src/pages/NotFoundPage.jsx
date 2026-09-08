import { Container } from "../components/layout/Container.jsx";
import { EmptyState } from "../components/ui/FeedbackStates.jsx";
import { Button } from "../components/ui/Button.jsx";
import { storefrontPaths } from "../app/routePaths.js";

/** Renders the storefront's recoverable unknown-route page. */
export function NotFoundPage() {
  return <Container className="py-20 sm:py-28"><EmptyState title="This page is not on the menu" message="We couldn't find the page you're looking for." action={<div className="flex flex-wrap justify-center gap-3"><Button to={storefrontPaths.home}>Go home</Button><Button to={storefrontPaths.menu} variant="secondary">View the menu</Button></div>} /></Container>;
}
