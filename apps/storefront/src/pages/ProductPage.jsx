import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { productPath, storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { useCart } from "../features/cart/context/cartContext.js";
import { useMenu, useProductSlugRedirects } from "../features/menu/hooks/useMenu.js";
import { ProductDetailDialog } from "../features/product-detail/components/ProductDetailDialog.jsx";

/** Exposes the existing customization flow at a stable crawlable product URL. */
export function ProductPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const menu = useMenu();
  const redirects = useProductSlugRedirects();
  const { addItem } = useCart();
  const { notify } = useToast();
  const product = useMemo(() => (menu.data || []).find((item) => item.slug === slug), [menu.data, slug]);
  const redirectProduct = useMemo(() => {
    const targetId = (redirects.data || []).find((item) => item.slug === slug)?.product_id;
    return targetId ? (menu.data || []).find((item) => item.id === targetId) : null;
  }, [menu.data, redirects.data, slug]);

  if (menu.isPending) return <Container className="py-16"><LoadingState title="Loading meal" message="Checking the current menu." /></Container>;
  if (menu.isError) return <Container className="py-16"><ErrorState title="We couldn't load this meal" message="Please check your connection and try again." action={<Button onClick={() => menu.refetch()}>Try again</Button>} /></Container>;
  if (!product && redirectProduct) return <Navigate replace to={productPath(redirectProduct.slug)} />;
  if (!product) return <Container className="py-20"><ErrorState title="This meal is not available" message="It may have been removed or is not currently public." action={<Button to={storefrontPaths.menu}>View the menu</Button>} /></Container>;

  const handleConfigured = (configuration) => {
    const result = addItem(configuration);
    notify(result.persisted ? `${product.name} added to your basket` : `${product.name} was added, but couldn't be saved for your next visit.`, result.persisted ? "success" : "error");
  };
  return <>
    <h1 className="sr-only">{product.name} prepared meal in Abuja</h1>
    <Container className="min-h-[40vh] py-10"><p className="text-sm text-muted">Review the current meal details and customize your order.</p></Container>
    <ProductDetailDialog product={product} open onClose={() => navigate(storefrontPaths.menu)} onConfigured={handleConfigured} />
  </>;
}
