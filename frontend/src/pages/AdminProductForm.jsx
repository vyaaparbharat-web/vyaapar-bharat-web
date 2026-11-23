import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import ProductForm from "../components/ProductForm";
import { ErrorState, PageHeader, PageLoader } from "../components/ui";

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const product = useApi(id ? `/api/products/${id}` : null);
  const companies = useApi("/api/suppliers");

  const save = async (form) => {
    await api(id ? `/api/products/${id}` : "/api/products", { method: id ? "PUT" : "POST", body: form });
    toast(id ? "Product saved" : "Product added");
    navigate("/admin/products");
  };

  const loading = product.loading || companies.loading;
  const error = product.error || companies.error;

  return (
    <>
      <PageHeader title={id ? "Edit product" : "Add product"} back={{ to: "/admin/products", label: "Products" }} />
      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <ProductForm initial={product.data?.product} companies={companies.data?.suppliers || []} onSubmit={save} submitLabel={id ? "Save product" : "Add product"} />
      )}
    </>
  );
}
