import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { Panel, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { CheckboxField, TextInput } from "../components/ui/FormControls.jsx";
import { demoDeliveryAreas } from "../fixtures/adminFixtures.js";

export function DeliveryPage() {
  return <><AdminPageHeader eyebrow="Delivery foundation" title="Delivery areas" description="Management table and edit-form layout only. Delivery data and fee persistence begin in later cycles." /><div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><DataTable caption="Demonstration delivery areas" columns={["Area", "Fee", "Status", "Action"]} rows={demoDeliveryAreas} renderRow={(area) => <tr key={area.area}><td className="px-4 py-4 text-sm font-semibold text-brand-950">{area.area}</td><td className="px-4 py-4 text-sm">{area.fee}</td><td className="px-4 py-4"><StatusBadge tone={area.tone}>{area.status}</StatusBadge></td><td className="px-4 py-4 text-sm font-semibold text-brand-700">Visual only</td></tr>} /><Panel className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Edit pattern</p><h2 className="mt-2 text-xl font-semibold text-brand-950">Delivery zone</h2><form className="mt-5 grid gap-5" onSubmit={(event) => event.preventDefault()}><TextInput label="Area name" defaultValue="Wuse 2" /><TextInput label="Delivery fee" defaultValue="₦2,000 demo" help="Not a stored or authoritative amount" /><CheckboxField label="Area active" help="Visual state only" defaultChecked /><Button disabled>Save begins in a later cycle</Button></form></Panel></div></>;
}
