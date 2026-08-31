import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";

export function SavedPage() {
  return <Container className="py-12 sm:py-16 lg:py-20"><PageHeader eyebrow="Saved meals" title="Good meals should be easy to find again." description="The route and empty-state foundation exist now. Favorite state and browser persistence begin in Cycle 8." /><div className="mt-10"><EmptyState title="No saved meals in this demo" message="When favorites are implemented, saved meals will remain local and will not require a customer account." action={<Button to={storefrontPaths.menu}>Explore the menu shell</Button>} /></div></Container>;
}
