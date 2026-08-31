import { Plus } from "lucide-react";
import { useState } from "react";

import { AdminPageHeader } from "../components/layout/AdminPageHeader.jsx";
import { FilterBar, StatusBadge } from "../components/ui/AdminPrimitives.jsx";
import { Button } from "../components/ui/Button.jsx";
import { DataTable } from "../components/ui/DataTable.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { SelectInput, TextArea, TextInput } from "../components/ui/FormControls.jsx";
import { useToast } from "../components/ui/toastContext.js";
import { demoAdminMeals } from "../fixtures/adminFixtures.js";

export function MenuPage() {
  const [dialogOpen, setDialogOpen] = useState(false); const { notify } = useToast();
  return <><AdminPageHeader eyebrow="Catalog foundation" title="Menu" description="Browse, filter, table, form, dialog, and status patterns using fixture meals only." actions={<Button onClick={() => setDialogOpen(true)}><Plus className="size-4" />Preview meal editor</Button>} /><FilterBar><TextInput fieldClassName="min-w-60 flex-1" label="Search products" type="search" placeholder="Search demo meals" help="No search logic" /><SelectInput fieldClassName="min-w-44" label="Category" defaultValue="all"><option value="all">All categories</option><option>Main meals</option><option>Grouped meals</option></SelectInput><SelectInput fieldClassName="min-w-44" label="Status" defaultValue="all"><option value="all">All statuses</option><option>Available</option><option>Sold out</option></SelectInput></FilterBar><div className="mt-5"><DataTable caption="Demonstration menu records" columns={["Meal", "Category", "Price", "Status", "Action"]} rows={demoAdminMeals} renderRow={(meal) => <tr key={meal.name}><td className="px-4 py-4 text-sm font-semibold text-brand-950">{meal.name}</td><td className="px-4 py-4 text-sm text-muted">{meal.category}</td><td className="px-4 py-4 text-sm">{meal.price}</td><td className="px-4 py-4"><StatusBadge tone={meal.tone}>{meal.status}</StatusBadge></td><td className="px-4 py-4"><button type="button" className="text-sm font-semibold text-brand-700" onClick={() => setDialogOpen(true)}>Preview</button></td></tr>} /></div><Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Meal editor pattern" description="Form architecture only—no product is created, changed, or stored." footer={<><Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => notify("Demo notification only — no product data changed.")}>Preview success toast</Button></>}><div className="grid gap-5"><TextInput label="Meal name" defaultValue="Demonstration meal" /><SelectInput label="Category" defaultValue="main"><option value="main">Main meal · demo</option></SelectInput><TextArea label="Description" defaultValue="Fixture content for visual layout only." /></div></Dialog></>;
}
