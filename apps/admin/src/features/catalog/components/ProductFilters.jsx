import { FilterBar } from "../../../components/ui/AdminPrimitives.jsx";
import { SelectInput, TextInput } from "../../../components/ui/FormControls.jsx";
import { catalogStatusOptions } from "../utils/catalogUtils.js";

export function ProductFilters({ filters, categories, onChange }) {
  return <FilterBar><TextInput fieldClassName="min-w-60 flex-1" label="Search products" type="search" placeholder="Search by meal name" value={filters.search} onChange={(event) => onChange({ ...filters, search: event.target.value })} /><SelectInput fieldClassName="min-w-44" label="Category" value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</SelectInput><SelectInput fieldClassName="min-w-44" label="Status" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}>{catalogStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</SelectInput></FilterBar>;
}
