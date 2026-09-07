import { useMemo, useState } from "react";

import { Container } from "../components/layout/Container.jsx";
import { Button } from "../components/ui/Button.jsx";
import { ErrorState } from "../components/ui/FeedbackStates.jsx";
import { PageHeader } from "../components/ui/Surface.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { MenuSkeleton } from "../features/menu/components/MenuSkeleton.jsx";
import { DietitianConsultation } from "../features/planner/components/DietitianConsultation.jsx";
import { useCategories, useMenu } from "../features/menu/hooks/useMenu.js";
import { PlannerConfirmationDialog } from "../features/planner/components/PlannerConfirmationDialog.jsx";
import { PlannerDuration } from "../features/planner/components/PlannerDuration.jsx";
import { PlannerLibrary } from "../features/planner/components/PlannerLibrary.jsx";
import { PlannerSchedule } from "../features/planner/components/PlannerSchedule.jsx";
import { PlannerSummary } from "../features/planner/components/PlannerSummary.jsx";
import { usePlanner } from "../features/planner/hooks/usePlanner.js";
import { calculatePlannerSummary } from "../features/planner/utils/plannerHydration.js";
import {
  getNextEmptySlot,
  getSlotMeal,
  PLANNER_SLOTS,
  populatedDaysRemovedByResize,
} from "../features/planner/utils/plannerModel.js";
import { ProductDetailDialog } from "../features/product-detail/components/ProductDetailDialog.jsx";
import { buildProductConfiguration } from "../features/product-detail/utils/customizationModel.js";

const emptyList = Object.freeze([]);

function slotLabel(address) {
  return PLANNER_SLOTS.find(({ key }) => key === address?.slot)?.label || "meal";
}

export function PlannerPage() {
  const planner = usePlanner();
  const { notify } = useToast();
  const categoriesQuery = useCategories();
  const menuQuery = useMenu();
  const categories = categoriesQuery.data || emptyList;
  const products = menuQuery.data || emptyList;
  const [activeTarget, setActiveTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [pendingDuration, setPendingDuration] = useState(null);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const summary = useMemo(() => calculatePlannerSummary(planner.plan, products), [planner.plan, products]);
  const selectedProduct = detail ? products.find((product) => product.id === detail.productId) || null : null;
  const initialConfiguration = detail?.target ? getSlotMeal(planner.plan, detail.target) : null;
  const isLoading = categoriesQuery.isPending || menuQuery.isPending;
  const hasError = categoriesQuery.isError || menuQuery.isError;

  function announcePersistence(result, successMessage) {
    notify(result.persisted ? successMessage : `${successMessage}, but we couldn't save the change for your next visit.`, result.persisted ? "success" : "error");
  }

  function selectTarget(address) {
    setActiveTarget(address);
    requestAnimationFrame(() => document.getElementById("planner-meal-search")?.focus());
  }

  function requestDuration(durationDays) {
    if (durationDays === planner.plan.durationDays) return;
    if (populatedDaysRemovedByResize(planner.plan, durationDays).length) {
      setPendingDuration(durationDays);
      return;
    }
    const result = planner.changeDuration(durationDays);
    if (activeTarget && !result.plan.days.some((day) => day.date === activeTarget.date)) setActiveTarget(null);
  }

  function confirmDuration() {
    const result = planner.changeDuration(pendingDuration);
    if (activeTarget && !result.plan.days.some((day) => day.date === activeTarget.date)) setActiveTarget(null);
    announcePersistence(result, `Plan shortened to ${pendingDuration} days`);
    setPendingDuration(null);
  }

  function openProduct(product, mode = "target", target = activeTarget) {
    if (!product.isOrderable) {
      setDetail({ productId: product.id, mode: "view", target: null });
      return;
    }
    const resolvedTarget = mode === "target" ? target : null;
    if (mode === "target" && !resolvedTarget) {
      setDetail({ productId: product.id, mode: "quick", target: null });
      return;
    }
    setDetail({ productId: product.id, mode, target: resolvedTarget });
  }

  function handleConfigured(configuration) {
    if (detail?.mode === "target" && detail.target) {
      const result = planner.assignMeal(detail.target, configuration);
      setActiveTarget(null);
      announcePersistence(result, `${selectedProduct?.name || "Meal"} placed in ${slotLabel(detail.target)}`);
      return;
    }
    const result = planner.quickAdd(configuration);
    if (!result.address) {
      notify("Every planner slot is already filled.", "error");
      return;
    }
    announcePersistence(result, `${selectedProduct?.name || "Meal"} placed in the next empty slot`);
  }

  function quickAddProduct(product) {
    if (!getNextEmptySlot(planner.plan)) {
      notify("Every planner slot is already filled.", "error");
      return;
    }
    const needsCustomization = product.isGrouped || product.addons.length > 0;
    if (needsCustomization) {
      openProduct(product, "quick", null);
      return;
    }
    const built = buildProductConfiguration({ product, variantId: null, addonIds: [], quantity: 1 });
    if (!built.valid) {
      notify(built.issues[0]?.message || "This meal cannot be added right now.", "error");
      return;
    }
    const result = planner.quickAdd(built.configuration);
    announcePersistence(result, `${product.name} placed in the next empty slot`);
  }

  function dropProduct(productId, address) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product?.isOrderable) {
      notify("That meal is not currently available.", "error");
      return;
    }
    if (product.isGrouped || product.addons.length) {
      setActiveTarget(address);
      openProduct(product, "target", address);
      return;
    }
    const built = buildProductConfiguration({ product, variantId: null, addonIds: [], quantity: 1 });
    if (!built.valid) return;
    announcePersistence(planner.assignMeal(address, built.configuration), `${product.name} placed in ${slotLabel(address)}`);
  }

  function removeMeal(address) {
    announcePersistence(planner.removeMeal(address), `${slotLabel(address)} cleared`);
    if (activeTarget?.date === address.date && activeTarget.slot === address.slot) setActiveTarget(null);
  }

  function moveMeal(source, target) {
    if (!getSlotMeal(planner.plan, source)) return;
    announcePersistence(planner.moveMeal(source, target), "Meal moved to its new slot");
    setActiveTarget(null);
  }

  function retry() {
    return Promise.all([categoriesQuery.refetch(), menuQuery.refetch()]);
  }

  return (
    <Container className="py-10 sm:py-14 lg:py-18">
      <PageHeader
        eyebrow="Meal planner"
        title="Build your week without overthinking it."
        description="Choose breakfast, lunch, dinner, and snacks across 2–7 days. See your schedule, estimated total, and daily nutrition as you plan."
      />

      {isLoading ? <MenuSkeleton /> : null}
      {!isLoading && hasError ? <ErrorState className="mt-8" title="We couldn't load meals for your plan" message="Your plan is still here. Check your connection and try again before adding more meals." action={<Button onClick={retry}>Try again</Button>} /> : null}
      {!isLoading && !hasError ? (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <section aria-labelledby="plan-schedule-title">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Your {planner.plan.durationDays}-day plan</p>
                <h2 id="plan-schedule-title" className="mt-2 font-display text-3xl text-brand-950">Plan one meal at a time.</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted">Choose a time slot, then pick a meal. You can also use Quick add or drag meals into place on desktop.</p>
            </div>
            <PlannerSchedule
              plan={summary.hydratedPlan}
              activeTarget={activeTarget}
              onSelect={selectTarget}
              onReplace={selectTarget}
              onRemove={removeMeal}
              onDropProduct={dropProduct}
              onMoveMeal={moveMeal}
            />
            <aside className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-[10rem_minmax(0,1fr)]" aria-label="Planning tip">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Planning tip</p>
              <p className="text-base leading-7 text-muted">Mix heavier and lighter meals across the week. The numbers stay visible, but planning should still feel like choosing food, not filling a spreadsheet.</p>
            </aside>
          </section>
          <aside className="grid gap-5 xl:sticky xl:top-6" aria-label="Planner controls and summary">
            <PlannerDuration durationDays={planner.plan.durationDays} onChange={requestDuration} />
            <PlannerLibrary products={products} categories={categories} activeTarget={activeTarget} onChoose={(product) => openProduct(product)} onQuickAdd={quickAddProduct} />
            <PlannerSummary plan={planner.plan} summary={summary} onClear={() => setClearConfirmationOpen(true)} />
            <DietitianConsultation />
            {!planner.persistenceAvailable ? <p className="rounded-control bg-red-50 p-3 text-sm text-danger" role="alert">We can't save this plan for your next visit. It will remain available while you keep this page open.</p> : null}
          </aside>
        </div>
      ) : null}

      {selectedProduct ? (
        <ProductDetailDialog
          key={`${selectedProduct.id}-${detail?.mode}-${detail?.target?.date || "quick"}-${detail?.target?.slot || "next"}`}
          product={selectedProduct}
          open
          onClose={() => setDetail(null)}
          onConfigured={detail.mode === "view" ? undefined : handleConfigured}
          initialConfiguration={initialConfiguration?.productId === selectedProduct.id ? initialConfiguration : null}
          submitLabel={detail.mode === "view" ? "Currently unavailable" : detail.mode === "target" ? `Place in ${slotLabel(detail.target)}` : "Add to next empty slot"}
          allowQuantity={false}
        />
      ) : null}
      <PlannerConfirmationDialog
        open={pendingDuration !== null}
        title={`Shorten this plan to ${pendingDuration || "fewer"} days?`}
        description="Meals on the days you're removing will also be cleared from your plan."
        confirmLabel="Shorten plan"
        onCancel={() => setPendingDuration(null)}
        onConfirm={confirmDuration}
      />
      <PlannerConfirmationDialog
        open={clearConfirmationOpen}
        title="Clear every selected meal?"
        description={`This keeps the ${planner.plan.durationDays}-day schedule and dates, but empties every breakfast, lunch, dinner, and snack slot.`}
        confirmLabel="Clear plan"
        onCancel={() => setClearConfirmationOpen(false)}
        onConfirm={() => {
          announcePersistence(planner.clearMeals(), "Meal plan cleared");
          setActiveTarget(null);
          setClearConfirmationOpen(false);
        }}
      />
    </Container>
  );
}
