import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import ProductForm from "../components/ProductForm";
import { ErrorState, PageHeader, PageLoader } from "../components/ui";

export default function SupplierProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useApi(id ? `/api/products/${id}` : null);

  const save = async (form) => {
    const { supplierId, ...body } = form; // company is always the supplier's own on the server
    void supplierId;
    await api(id ? `/api/products/${id}` : "/api/products", { method: id ? "PUT" : "POST", body });
    toast(id ? "Product saved" : "Product added");
    navigate("/supplier/products");
  };

  return (
    <>
      <PageHeader title={id ? "Edit product" : "Add a product"} back={{ to: "/supplier/products", label: "My products" }} />
      {loading ? <PageLoader /> : error ? <ErrorState error={error} /> : <ProductForm initial={data?.product} onSubmit={save} submitLabel={id ? "Save product" : "Add product"} />}
    </>
  );
}
