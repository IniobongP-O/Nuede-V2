import { Container } from "../components/layout/Container.jsx";
import { EmptyState } from "../components/ui/FeedbackStates.jsx";
import { Button } from "../components/ui/Button.jsx";
import { storefrontPaths } from "../app/routePaths.js";

export function NotFoundPage() {
  return <Container className="py-20 sm:py-28"><EmptyState title="This page is not on the menu" message="The address does not match a Cycle 1 storefront route." action={<div className="flex flex-wrap justify-center gap-3"><Button to={storefrontPaths.home}>Go home</Button><Button to={storefrontPaths.menu} variant="secondary">View menu shell</Button></div>} /></Container>;
}
