import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { date } from "../lib/format";
import { Badge, Field, FormError, PageHeader, Spinner } from "../components/ui";

function PasswordForm({ hasPassword }) {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/password", { method: "PATCH", body: form });
      toast("Password changed");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel grid gap-5 p-6 sm:p-7">
      <div>
        <h2 className="text-[18px] font-bold">{hasPassword ? "Change password" : "Set a password"}</h2>
        {!hasPassword && <p className="mt-1 text-[14px] text-muted">You sign in with Google. Add a password to also log in with your email.</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {hasPassword && (
          <Field label="Current password" htmlFor="currentPassword">
            <input id="currentPassword" type="password" className="input" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
          </Field>
        )}
        <Field label="New password" htmlFor="newPassword" hint="At least 8 characters.">
          <input id="newPassword" type="password" className="input" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
        </Field>
      </div>
      <FormError>{error}</FormError>
      <div>
        <button className="btn btn-dark" disabled={busy || form.newPassword.length < 8}>
          {busy && <Spinner className="h-4 w-4 !text-white" />} {hasPassword ? "Change password" : "Set password"}
        </button>
      </div>
    </form>
  );
}

export default function MyProfile() {
  const { user, updateUser, isSupplier } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "",
    city: user?.city || "",
    gstNumber: user?.gstNumber || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/auth/profile", { method: "PATCH", body: form });
      updateUser(data.user);
      toast("Profile saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const roleLabel = { supplier: "Supplier", buyer: "Buyer", user: "Buyer", admin: "Admin", super_admin: "Super admin" }[user?.role];

  return (
    <>
      <PageHeader title="My account" description="Your personal details. These are shown to the other side when you post or quote." />
      <div className="grid gap-6">
        <form onSubmit={submit} className="panel grid gap-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-[18px] font-bold">Details</h2>
            <Badge tone="neel">{roleLabel} account</Badge>
            {user?.isVerified && <Badge tone="ok">Email verified</Badge>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name">
              <input id="name" name="name" className="input" value={form.name} onChange={set} required />
            </Field>
            <Field label="Email" htmlFor="email" hint="Contact support to change your email.">
              <input id="email" className="input bg-page" value={user?.email || ""} disabled />
            </Field>
            <Field label="Mobile number" htmlFor="phone" optional>
              <input id="phone" name="phone" type="tel" className="input" value={form.phone} onChange={set} />
            </Field>
            <Field label="City" htmlFor="city" optional>
              <input id="city" name="city" className="input" value={form.city} onChange={set} />
            </Field>
            <Field label="Company name" htmlFor="companyName" optional hint={isSupplier ? "Your public company name is edited in Company profile." : null}>
              <input id="companyName" name="companyName" className="input" value={form.companyName} onChange={set} />
            </Field>
            <Field label="GST number" htmlFor="gstNumber" optional>
              <input id="gstNumber" name="gstNumber" className="input uppercase" value={form.gstNumber} onChange={set} maxLength={15} />
            </Field>
          </div>
          <FormError>{error}</FormError>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">Member since {date(user?.createdAt)}</span>
            <button className="btn btn-primary" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />} Save details
            </button>
          </div>
        </form>
        <PasswordForm hasPassword={user?.authProvider !== "google"} />
      </div>
    </>
  );
}
