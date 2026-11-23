import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import CompanyForm from "../components/CompanyForm";
import { ErrorState, PageHeader, PageLoader } from "../components/ui";

export default function AdminCompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useApi(id ? `/api/suppliers/${id}` : null);

  const save = async (form) => {
    await api(id ? `/api/admin/suppliers/${id}` : "/api/suppliers", { method: id ? "PUT" : "POST", body: form });
    toast(id ? "Company saved" : "Company added");
    navigate("/admin/companies");
  };

  return (
    <>
      <PageHeader title={id ? "Edit company" : "Add company"} back={{ to: "/admin/companies", label: "Companies" }} />
      {loading ? <PageLoader /> : error ? <ErrorState error={error} /> : <CompanyForm initial={data?.supplier} onSubmit={save} allowVerify submitLabel={id ? "Save company" : "Add company"} />}
    </>
  );
}
