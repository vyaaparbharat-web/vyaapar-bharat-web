import { useState } from "react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { date } from "../lib/format";
import AdminTable from "../components/AdminTable";
import { Avatar, Badge, PageHeader } from "../components/ui";

const ROLE_LABEL = { user: "Not chosen", buyer: "Buyer", supplier: "Supplier", admin: "Admin", super_admin: "Super admin" };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi("/api/admin/users");
  const [busyId, setBusyId] = useState(null);

  const update = async (u, body) => {
    setBusyId(u.id);
    try {
      const res = await api(`/api/admin/users/${u.id}`, { method: "PATCH", body });
      setData((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? res.user : x)) }));
      toast("User updated");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  const roles = me?.role === "super_admin" ? ["buyer", "supplier", "admin"] : ["buyer", "supplier"];

  return (
    <>
      <PageHeader title="Users" description="Accounts on the platform. Disabled users can't log in." />
      <AdminTable
        rows={data?.users}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search name, email, company"
        searchKeys={["name", "email", "companyName", "phone"]}
        filters={[
          { key: "role", label: "Role", options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })), match: (u, v) => u.role === v },
          {
            key: "active",
            label: "Status",
            options: [
              { value: "yes", label: "Active" },
              { value: "no", label: "Disabled" },
            ],
            match: (u, v) => (v === "yes" ? u.isActive : !u.isActive),
          },
        ]}
        columns={[
          {
            key: "name",
            label: "User",
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size={34} />
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-[12.5px] text-muted">{u.email}</div>
                </div>
              </div>
            ),
          },
          { key: "companyName", label: "Company", render: (u) => u.companyName || <span className="text-muted">—</span> },
          { key: "phone", label: "Phone", render: (u) => u.phone || <span className="text-muted">—</span> },
          {
            key: "role",
            label: "Role",
            render: (u) =>
              u.role === "super_admin" || u.id === me?.id || (u.role === "admin" && me?.role !== "super_admin") ? (
                <Badge tone="neel">{ROLE_LABEL[u.role]}</Badge>
              ) : (
                <select className="input !h-9 !w-36 !text-[13.5px]" value={u.role} disabled={busyId === u.id} onChange={(e) => update(u, { role: e.target.value })} aria-label={`Role for ${u.name}`}>
                  {u.role === "user" && <option value="user">Not chosen</option>}
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              ),
          },
          { key: "createdAt", label: "Joined", className: "whitespace-nowrap text-muted", render: (u) => date(u.createdAt) },
          {
            key: "active",
            label: "Access",
            render: (u) =>
              u.role === "super_admin" || u.id === me?.id ? (
                <Badge tone="ok">Active</Badge>
              ) : (
                <button className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-ok"}`} disabled={busyId === u.id} onClick={() => update(u, { isActive: !u.isActive })}>
                  {u.isActive ? "Disable" : "Enable"}
                </button>
              ),
          },
        ]}
      />
    </>
  );
}
