import { StatusBadge } from "../../../components/ui/AdminPrimitives.jsx";

const statusPresentation = {
  available: { label: "Available", tone: "success" },
  sold_out: { label: "Sold out", tone: "warning" },
  price_pending: { label: "Price pending", tone: "warning" },
  hidden: { label: "Hidden", tone: "neutral" },
  archived: { label: "Archived", tone: "danger" },
  unavailable: { label: "Unavailable", tone: "neutral" },
};

/** Maps a catalog availability status to its label and semantic badge tone. */
/** Renders a product availability value with its configured admin tone and label. */
export function ProductStatusBadge({ status }) {
  const presentation = statusPresentation[status] || { label: status, tone: "neutral" };
  return <StatusBadge tone={presentation.tone}>{presentation.label}</StatusBadge>;
}
