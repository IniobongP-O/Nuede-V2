import { zodResolver } from "@hookform/resolvers/zod";
import { formatKobo } from "@nuede/domain/currency";
import { checkoutFormSchema } from "@nuede/validation/checkout";
import { AlertTriangle, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import { storefrontPaths } from "../app/routePaths.js";
import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";
import { CheckoutApiError, createWhatsappOrder, initializePaystackCheckout } from "../features/checkout/api/checkoutApi.js";
import { CheckoutReview } from "../features/checkout/components/CheckoutReview.jsx";
import { DeliveryDetailsSection } from "../features/checkout/components/DeliveryDetailsSection.jsx";
import { PaystackCheckoutReady } from "../features/checkout/components/PaystackCheckoutReady.jsx";
import { PaymentMethodsSection } from "../features/checkout/components/PaymentMethodsSection.jsx";
import { WhatsappOrderCreated } from "../features/checkout/components/WhatsappOrderCreated.jsx";
import { useCheckoutRealtime, useCheckoutSettings, useDeliveryZones } from "../features/checkout/hooks/useCheckoutQueries.js";
import { buildCheckoutSubmission, calculateEstimatedTotal, CHECKOUT_SOURCE, getCheckoutReadiness, getEnabledPaymentMethods, parseCheckoutSource } from "../features/checkout/utils/checkoutModel.js";
import { redirectToPaystackCheckout } from "../features/checkout/utils/paystackCheckout.js";
import { openWhatsappHandoff } from "../features/checkout/utils/whatsappHandoff.js";
import { useCart } from "../features/cart/context/cartContext.js";
import { calculateCartSubtotal, calculateHydratedCartNutrition, hydrateCartItems } from "../features/cart/utils/cartModel.js";
import { useMenu } from "../features/menu/hooks/useMenu.js";
import { usePlanner } from "../features/planner/hooks/usePlanner.js";
import { calculatePlannerSummary } from "../features/planner/utils/plannerHydration.js";

const emptyList = Object.freeze([]);
const defaultValues = Object.freeze({ fullName: "", phone: "", email: "", address: "", landmark: "", deliveryZoneId: "", paymentMethod: "" });

/** Renders navigation back to the cart or planner that initiated checkout. */
function SourceActions({ source }) {
  return <div className="flex flex-wrap justify-center gap-3"><Button to={source === CHECKOUT_SOURCE.mealPlan ? storefrontPaths.planner : storefrontPaths.menu}>{source === CHECKOUT_SOURCE.mealPlan ? "Return to meal planner" : "Return to menu"}</Button>{!source ? <Button variant="secondary" to={`${storefrontPaths.checkout}?source=meal-plan`}>Review meal plan</Button> : null}</div>;
}

/** Chooses the most useful source-level checkout blocking message. */
function sourceProblem(source, cartCount, plannerCount) {
  if (source === CHECKOUT_SOURCE.cart && cartCount === 0) return { title: "Your basket is empty", message: "Add at least one meal before continuing to checkout." };
  if (source === CHECKOUT_SOURCE.mealPlan && plannerCount === 0) return { title: "Your meal plan is empty", message: "Choose at least one meal for your plan before continuing to checkout." };
  return null;
}

/** Coordinates source hydration, delivery details, payment choice, and order creation. */
export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const source = parseCheckoutSource(searchParams.get("source"));
  const cart = useCart();
  const planner = usePlanner();
  const menuQuery = useMenu();
  const deliveryQuery = useDeliveryZones(Boolean(source));
  const settingsQuery = useCheckoutSettings(Boolean(source));
  useCheckoutRealtime(Boolean(source));
  const [notice, setNotice] = useState("");
  const [domainIssues, setDomainIssues] = useState([]);
  const [paystackReady, setPaystackReady] = useState(null);
  const [paystackFailure, setPaystackFailure] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const { register, control, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(checkoutFormSchema), defaultValues });
  const selectedZoneId = useWatch({ control, name: "deliveryZoneId" });
  const selectedPaymentMethod = useWatch({ control, name: "paymentMethod" });

  const products = menuQuery.data || emptyList;
  const hydratedCart = useMemo(() => hydrateCartItems(cart.items, products), [cart.items, products]);
  const cartSubtotal = useMemo(() => calculateCartSubtotal(hydratedCart), [hydratedCart]);
  const cartNutrition = useMemo(() => calculateHydratedCartNutrition(hydratedCart), [hydratedCart]);
  const plannerSummary = useMemo(() => calculatePlannerSummary(planner.plan, products), [planner.plan, products]);
  const zones = deliveryQuery.data || emptyList;
  const enabledMethods = useMemo(() => getEnabledPaymentMethods(settingsQuery.data), [settingsQuery.data]);
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) || null;
  const sourceIssues = source === CHECKOUT_SOURCE.cart
    ? hydratedCart.filter((item) => !item.orderable || !item.price.complete).map((item) => ({ code: item.status, message: `${item.product?.name || "A basket item"}: ${item.message}` }))
    : plannerSummary.issues;
  const sourceEmpty = source === CHECKOUT_SOURCE.cart ? cart.items.length === 0 : plannerSummary.selectedMealCount === 0;
  const subtotalKobo = source === CHECKOUT_SOURCE.cart ? cartSubtotal.subtotalKobo : plannerSummary.estimatedFoodTotalKobo;
  const nutrition = source === CHECKOUT_SOURCE.cart ? cartNutrition : plannerSummary.nutrition.total;
  const totalKobo = selectedZone ? calculateEstimatedTotal(subtotalKobo, selectedZone.feeKobo) : null;
  const readiness = getCheckoutReadiness({ source, sourcePending: menuQuery.isPending, sourceError: menuQuery.isError, sourceEmpty, sourceIssues, zonesPending: deliveryQuery.isPending, zonesError: deliveryQuery.isError, zone: selectedZone, settingsPending: settingsQuery.isPending, settingsError: settingsQuery.isError, enabledMethods, paymentMethod: selectedPaymentMethod });

  useEffect(() => {
    if (!deliveryQuery.isSuccess || !selectedZoneId || zones.some((zone) => zone.id === selectedZoneId)) return;
    const timeout = window.setTimeout(() => {
      setValue("deliveryZoneId", "", { shouldValidate: true });
      setNotice("Your selected delivery area is no longer available. Please choose another active area.");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [deliveryQuery.isSuccess, selectedZoneId, setValue, zones]);

  useEffect(() => {
    if (!settingsQuery.isSuccess) return;
    const timeout = window.setTimeout(() => {
      if (selectedPaymentMethod && !enabledMethods.some((method) => method.id === selectedPaymentMethod)) {
        setValue("paymentMethod", "", { shouldValidate: true });
        setNotice("Your selected payment method is no longer available. Please choose another option.");
      } else if (!selectedPaymentMethod && enabledMethods.length === 1) {
        setValue("paymentMethod", enabledMethods[0].id, { shouldValidate: true });
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [enabledMethods, selectedPaymentMethod, setValue, settingsQuery.isSuccess]);

  /** Builds the authoritative contract, creates the chosen order, and routes handoff. */
  async function submit(values, event) {
    // Lock both React state and the form node before awaiting. This narrows the
    // double-submit window that exists before React commits a disabled state.
    const submittedForm = event?.currentTarget;
    if (submissionLocked || submittedForm?.dataset.orderSubmissionLocked === "true") return;
    if (submittedForm) submittedForm.dataset.orderSubmissionLocked = "true";
    setSubmissionLocked(true);
    setDomainIssues([]);
    setNotice("");
    setPaystackReady(null);
    setPaystackFailure(null);
    try {
      // Refresh mutable checkout inputs for immediate feedback. These checks do
      // not replace the server's authoritative reload and validation.
      const [menuResult, zoneResult, settingsResult] = await Promise.all([menuQuery.refetch(), deliveryQuery.refetch(), settingsQuery.refetch()]);
      if (menuResult.isError || zoneResult.isError || settingsResult.isError) throw new Error("Checkout data could not be refreshed.");
      const liveZone = (zoneResult.data || []).find((zone) => zone.id === values.deliveryZoneId) || null;
      const liveMethods = getEnabledPaymentMethods(settingsResult.data);
      if (!liveZone) {
        setValue("deliveryZoneId", "", { shouldValidate: true });
        setError("deliveryZoneId", { type: "manual", message: "That delivery area is no longer active. Choose another area." }, { shouldFocus: true });
        setNotice("Delivery availability changed while you were reviewing checkout.");
        return;
      }
      if (!liveMethods.some((method) => method.id === values.paymentMethod)) {
        setValue("paymentMethod", "", { shouldValidate: true });
        setError("paymentMethod", { type: "manual", message: "That payment method is no longer available." }, { shouldFocus: true });
        setNotice("Payment availability changed while you were reviewing checkout.");
        return;
      }
      const liveProducts = menuResult.data || [];
      const liveCart = hydrateCartItems(cart.items, liveProducts);
      const livePlanner = calculatePlannerSummary(planner.plan, liveProducts);
      const liveSourceIssues = source === CHECKOUT_SOURCE.cart
        ? liveCart.filter((item) => !item.orderable || !item.price.complete).map((item) => ({ code: item.status, message: `${item.product?.name || "A basket item"}: ${item.message}` }))
        : livePlanner.issues;
      const liveEmpty = source === CHECKOUT_SOURCE.cart ? cart.items.length === 0 : livePlanner.selectedMealCount === 0;
      if (liveEmpty || liveSourceIssues.length) {
        setDomainIssues(liveEmpty ? [{ code: "empty_source", message: source === CHECKOUT_SOURCE.cart ? "Your basket is now empty. Add a meal before trying again." : "Your meal plan is now empty. Add a meal before trying again." }] : liveSourceIssues);
        return;
      }
      const contract = buildCheckoutSubmission({ source, customer: values, deliveryZoneId: liveZone.id, paymentMethod: values.paymentMethod, cartItems: cart.items, plan: planner.plan });
      if (values.paymentMethod === "paystack") {
        const payment = await initializePaystackCheckout(contract);
        const liveSubtotalKobo = source === CHECKOUT_SOURCE.cart ? calculateCartSubtotal(liveCart).subtotalKobo : livePlanner.estimatedFoodTotalKobo;
        const liveTotalKobo = calculateEstimatedTotal(liveSubtotalKobo, liveZone.feeKobo);
        const priceChanged = payment.amountKobo !== liveTotalKobo;
        // Initialization has already created a permanent order and pending
        // payment attempt, so local selections can now be cleared safely.
        if (source === CHECKOUT_SOURCE.cart) cart.clearCart();
        else planner.clearMeals();
        if (priceChanged || !redirectToPaystackCheckout(payment.authorizationUrl)) {
          setPaystackReady({ ...payment, priceChanged });
          requestAnimationFrame(() => document.getElementById("paystack-checkout-ready")?.focus());
        }
        return;
      }

      const order = await createWhatsappOrder(contract);
      const completedHandoff = { ...order, automaticOpenBlocked: false };
      setHandoff(completedHandoff);
      // WhatsApp is opened only after the backend has persisted the permanent
      // unpaid/pending order and returned its authoritative snapshot.
      if (source === CHECKOUT_SOURCE.cart) cart.clearCart();
      else planner.clearMeals();
      const opened = openWhatsappHandoff(order.whatsapp.url);
      if (!opened) setHandoff({ ...completedHandoff, automaticOpenBlocked: true });
      requestAnimationFrame(() => document.getElementById("whatsapp-order-created")?.focus());
    } catch (error) {
      if (error instanceof CheckoutApiError && ["PAYMENT_METHOD_DISABLED", "WHATSAPP_DISABLED"].includes(error.code)) {
        setValue("paymentMethod", "", { shouldValidate: true });
        setNotice("Payment availability changed while you were reviewing checkout. Choose another enabled option.");
        void settingsQuery.refetch();
      }
      if (error instanceof CheckoutApiError && error.order?.paymentMethod === "paystack" && error.order.paymentReference) {
        setPaystackFailure(error.order);
        if (source === CHECKOUT_SOURCE.cart) cart.clearCart();
        else planner.clearMeals();
        requestAnimationFrame(() => document.getElementById("paystack-initialization-failed")?.focus());
        return;
      }
      if (error instanceof CheckoutApiError && error.order?.orderReference) {
        setHandoff({ ...error.order, whatsapp: null, handoffError: error.message, automaticOpenBlocked: true });
        if (source === CHECKOUT_SOURCE.cart) cart.clearCart();
        else planner.clearMeals();
        requestAnimationFrame(() => document.getElementById("whatsapp-order-created")?.focus());
        return;
      }
      setDomainIssues([{
        code: error instanceof CheckoutApiError ? error.code : "checkout_failure",
        message: error instanceof CheckoutApiError ? error.message : "We couldn't complete checkout. Your details and selections are still here, so please try again.",
      }]);
      requestAnimationFrame(() => document.getElementById("checkout-issues-title")?.focus());
    } finally {
      if (submittedForm) delete submittedForm.dataset.orderSubmissionLocked;
      setSubmissionLocked(false);
    }
  }

  if (paystackReady) return <Container className="py-10 sm:py-14 lg:py-18"><PaystackCheckoutReady payment={paystackReady} priceChanged={paystackReady.priceChanged} /></Container>;
  if (paystackFailure) return <Container className="py-10 sm:py-14 lg:py-18"><section id="paystack-initialization-failed" tabIndex="-1" className="rounded-card border border-red-200 bg-red-50 p-6 outline-none sm:p-8" role="alert"><h1 className="font-display text-4xl text-brand-950">We couldn't open Paystack.</h1><p className="mt-4 max-w-2xl leading-7 text-danger">We saved order <strong>{paystackFailure.orderReference}</strong>, but your payment isn't confirmed yet. Check your payment status before trying again.</p><Button className="mt-6" to={`${storefrontPaths.payment}?reference=${encodeURIComponent(paystackFailure.paymentReference)}`} variant="secondary">Check payment status</Button></section></Container>;
  if (handoff) return <Container className="py-10 sm:py-14 lg:py-18"><WhatsappOrderCreated order={handoff} /></Container>;
  if (!source) return <Container className="py-12 sm:py-16"><EmptyState title="Choose what you'd like to check out" message="Continue with your basket, or review your meal plan before placing your order." action={<SourceActions source={null} />} /></Container>;
  if (menuQuery.isPending) return <Container className="py-12 sm:py-16"><LoadingState title="Checking your order" message="We're checking your meals, prices, availability, and nutrition." /></Container>;
  if (menuQuery.isError) return <Container className="py-12 sm:py-16"><ErrorState title="We couldn't review your order" message="Your selections are still here. Check your connection and try again." action={<Button onClick={() => menuQuery.refetch()}>Try again</Button>} /></Container>;
  const emptyProblem = sourceProblem(source, cart.items.length, plannerSummary.selectedMealCount);
  if (emptyProblem) return <Container className="py-12 sm:py-16"><EmptyState {...emptyProblem} action={<SourceActions source={source} />} /></Container>;

  return (
    <Container className="py-10 pb-44 sm:py-14 sm:pb-36 lg:pb-20 lg:py-18">
      <PageHeader eyebrow="Checkout" title="Review your order." description={`Check ${source === CHECKOUT_SOURCE.cart ? "your basket" : "your meal plan"}, add your delivery details, and choose how you'd like to pay.`} />
      {notice ? <p className="mt-6 flex gap-2 rounded-control border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-warning" role="alert"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{notice}</p> : null}
      {domainIssues.length ? <section className="mt-6 rounded-control border border-red-200 bg-red-50 p-4" role="alert" aria-labelledby="checkout-issues-title"><h2 id="checkout-issues-title" tabIndex="-1" className="font-semibold text-danger outline-none">Checkout needs attention</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">{domainIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul></section> : null}
      <form className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]" noValidate onSubmit={handleSubmit(submit)}>
        <div className="grid gap-6">
          {deliveryQuery.isPending ? <LoadingState title="Loading delivery areas" message="We're checking where we can deliver and the current fees." /> : null}
          {deliveryQuery.isError ? <ErrorState title="We couldn't load delivery areas" message="Please try again before continuing to checkout." action={<Button onClick={() => deliveryQuery.refetch()}>Try again</Button>} /> : null}
          {deliveryQuery.isSuccess && zones.length === 0 ? <EmptyState title="Delivery is temporarily unavailable" message="We don't have any delivery areas available right now. Please check back later." /> : null}
          {deliveryQuery.isSuccess && zones.length > 0 ? <DeliveryDetailsSection register={register} errors={errors} zones={zones} disabled={isSubmitting} /> : null}
          {settingsQuery.isPending ? <LoadingState title="Loading payment options" message="We're checking the payment methods available for your order." /> : null}
          {settingsQuery.isError ? <ErrorState title="We couldn't load payment options" message="Please try again before continuing to checkout." action={<Button onClick={() => settingsQuery.refetch()}>Try again</Button>} /> : null}
          {settingsQuery.isSuccess && enabledMethods.length === 0 ? <EmptyState title="Checkout is temporarily unavailable" message="There are no payment methods available right now. Your selections are still here." /> : null}
          {settingsQuery.isSuccess && enabledMethods.length > 0 ? <PaymentMethodsSection methods={enabledMethods} register={register} error={errors.paymentMethod?.message} disabled={isSubmitting} /> : null}
        </div>
        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start" aria-label="Order summary and checkout action">
          <CheckoutReview source={source} cartItems={hydratedCart} plannerSummary={plannerSummary} nutrition={nutrition} subtotalKobo={subtotalKobo} selectedZone={selectedZone} totalKobo={totalKobo} />
          {sourceIssues.length ? <p className="rounded-control bg-red-50 p-4 text-sm leading-6 text-danger" role="alert">Return to your {source === CHECKOUT_SOURCE.cart ? "basket" : "meal planner"} to resolve {sourceIssues.length} unavailable {sourceIssues.length === 1 ? "selection" : "selections"}.</p> : null}
          <section className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-brand-950" aria-labelledby="refund-policy-title">
            <h2 id="refund-policy-title" className="font-semibold">A quick note before you order</h2>
            <p className="mt-1 text-muted">Please review your order carefully before paying. All orders are final and non-refundable. If something is wrong with your order, please contact us and we’ll be happy to help.</p>
          </section>
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0"><div className="mx-auto grid max-w-7xl gap-2 sm:flex sm:items-center sm:gap-3 lg:block"><p className="min-w-0 text-sm sm:flex-1 lg:mb-3"><span className="block text-xs text-muted">Estimated total</span><span className="font-semibold text-brand-950">{totalKobo === null ? "Choose delivery" : formatKobo(totalKobo)}</span></p><Button type="submit" size="large" busy={isSubmitting || submissionLocked} disabled={!readiness.ready || isSubmitting || submissionLocked} className="w-full sm:w-auto lg:w-full"><LockKeyhole className="size-4" aria-hidden="true" />{isSubmitting ? selectedPaymentMethod === "paystack" ? "Opening secure payment..." : "Creating your order..." : selectedPaymentMethod === "whatsapp" ? "Continue on WhatsApp" : selectedPaymentMethod === "paystack" ? "Pay with Paystack" : "Choose a payment method"}</Button></div><p className="mt-2 text-center text-xs text-muted">{selectedPaymentMethod === "whatsapp" ? "We'll save your order before opening WhatsApp." : "We'll confirm your final total before Paystack opens."}</p></div>
        </aside>
      </form>
    </Container>
  );
}
