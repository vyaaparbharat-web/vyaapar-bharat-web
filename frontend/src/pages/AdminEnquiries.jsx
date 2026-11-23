import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { ago } from "../lib/format";
import AdminTable from "../components/AdminTable";
import { PageHeader } from "../components/ui";

export default function AdminEnquiries() {
  const { data, loading, error, reload } = useApi("/api/admin/enquiries");
  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent to suppliers from their profile pages." />
      <AdminTable
        rows={data?.enquiries}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search name, supplier, message"
        searchKeys={["name", "email", "phone", "supplier_name", "message"]}
        columns={[
          {
            key: "from",
            label: "From",
            render: (e) => (
              <>
                <div className="font-semibold">{e.name}</div>
                <div className="text-[12.5px] text-muted">{[e.phone, e.email].filter(Boolean).join(", ")}</div>
              </>
            ),
          },
          {
            key: "supplier_name",
            label: "To",
            render: (e) =>
              e.supplier_id ? (
                <Link to={`/suppliers/${e.supplier_id}`} className="hover:text-neel-700">
                  {e.supplier_name}
                </Link>
              ) : (
                "—"
              ),
          },
          { key: "message", label: "Message", className: "max-w-md", render: (e) => <p className="line-clamp-3">{e.message}</p> },
          { key: "created_at", label: "Sent", className: "whitespace-nowrap text-muted", render: (e) => ago(e.created_at) },
        ]}
      />
    </>
  );
}
