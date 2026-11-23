import { Inbox, Mail, Phone } from "lucide-react";
import { useApi } from "../lib/useApi";
import { ago } from "../lib/format";
import { EmptyState, ErrorState, PageHeader, PageLoader } from "../components/ui";

// "Contact supplier" messages sent to the logged-in supplier's company
export default function SupplierEnquiries() {
  const { data, loading, error, reload } = useApi("/api/supplier/enquiries");
  const list = data?.enquiries || [];

  return (
    <>
      <PageHeader title="Enquiries" description="Messages buyers sent from your company profile or product pages." />
      <div className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : list.length === 0 ? (
          <EmptyState icon={Inbox} title="No enquiries yet">
            A complete profile with photos and products gets more enquiries.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((e) => (
              <li key={e.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-[13px] text-muted">{ago(e.created_at)}</div>
                </div>
                {e.product_name && <div className="text-[13px] text-muted">About: {e.product_name}{e.quantity ? `, qty ${e.quantity}` : ""}</div>}
                <p className="mt-2 whitespace-pre-line text-[14.5px]">{e.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.phone && (
                    <a href={`tel:${e.phone}`} className="btn btn-outline btn-sm">
                      <Phone className="h-4 w-4" /> {e.phone}
                    </a>
                  )}
                  {e.email && (
                    <a href={`mailto:${e.email}`} className="btn btn-outline btn-sm">
                      <Mail className="h-4 w-4" /> Reply by email
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
