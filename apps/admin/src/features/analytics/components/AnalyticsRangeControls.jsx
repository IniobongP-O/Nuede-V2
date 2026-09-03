import { Button } from "../../../components/ui/Button.jsx";
import { SelectInput, TextInput } from "../../../components/ui/FormControls.jsx";
import { analyticsPresetOptions } from "../utils/analyticsUtils.js";

export function AnalyticsRangeControls({ controller, compact = false }) {
  const { preset, draft, validationError, selectPreset, updateDraft, applyCustomRange } = controller;
  return <div className={`flex flex-wrap items-end gap-3 ${compact ? "max-w-xl" : "w-full"}`}>
    <div className="min-w-40 flex-1 sm:flex-none">
      <SelectInput label="Date range" value={preset} onChange={(event) => selectPreset(event.target.value)}>
        {analyticsPresetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </SelectInput>
    </div>
    {preset === "custom" ? <>
      <div className="min-w-36 flex-1 sm:flex-none"><TextInput label="Start date" type="date" value={draft.from} onChange={(event) => updateDraft("from", event.target.value)} /></div>
      <div className="min-w-36 flex-1 sm:flex-none"><TextInput label="End date" type="date" value={draft.to} onChange={(event) => updateDraft("to", event.target.value)} /></div>
      <Button type="button" variant="secondary" onClick={applyCustomRange}>Apply</Button>
    </> : null}
    {validationError ? <p className="w-full text-sm font-semibold text-danger" role="alert">{validationError}</p> : null}
  </div>;
}

