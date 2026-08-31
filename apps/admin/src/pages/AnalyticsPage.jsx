import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { ErrorState } from "../components/ui/FeedbackStates.jsx";
import { MetricCard, Panel } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { SelectInput } from "../components/ui/FormControls.jsx";
import { demoChartPoints, demoMetrics } from "../fixtures/adminFixtures.js";

export function AnalyticsPage() {
  return <><AdminPageHeader eyebrow="Reporting foundation" title="Analytics" description="Cards, range controls, chart containers, and recovery states only. Production analytics is Cycle 16." actions={<div className="w-44"><SelectInput label="Date range" defaultValue="30"><option value="7">7 days · demo</option><option value="30">30 days · demo</option><option value="90">90 days · demo</option></SelectInput></div>} /><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{demoMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div><div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><Panel className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Revenue chart</p><h2 className="mt-2 text-xl font-semibold text-brand-950">Static reporting canvas</h2><div className="mt-8 flex h-64 items-end gap-2 border-b border-l border-line p-3">{demoChartPoints.map((point, index) => <div key={`${index}-${point}`} className="flex-1 rounded-t bg-brand-700" style={{ height: `${point}%`, opacity: 0.35 + index * 0.05 }} />)}</div><p className="mt-3 text-xs text-muted">No data aggregation or Recharts dependency exists.</p></Panel><ErrorState title="Recovery pattern" message="A real analytics failure will explain what is unavailable and provide a safe retry." action={<Button variant="secondary" disabled>Retry example</Button>} /></div></>;
}
