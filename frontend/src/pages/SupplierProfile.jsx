import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import CompanyForm from "../components/CompanyForm";
import { ErrorState, PageHeader, PageLoader } from "../components/ui";

export default function SupplierProfile() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/supplier/profile");

  const save = async (form) => {
    await api("/api/supplier/profile", { method: "PUT", body: form });
    toast("Company profile saved");
    reload();
  };

  return (
    <>
      <PageHeader
        title="Company profile"
        description="This is what buyers see in the supplier directory and on your quotes."
        actions={
          data?.company && (
            <Link to={`/suppliers/${data.company.id}`} className="btn btn-outline">
              View public profile
            </Link>
          )
        }
      />
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <CompanyForm key={data.company.updated_at} initial={data.company} onSubmit={save} submitLabel="Save profile" />
      )}
    </>
  );
}
