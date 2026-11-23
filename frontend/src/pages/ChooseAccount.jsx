import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/roles";
import { useToast } from "../context/ToastContext";
import { Field, FormError, Spinner } from "../components/ui";

function Option({ value, current, onSelect, icon: Icon, title, text }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={current === value}
      className={`flex flex-col items-start gap-3 rounded-[16px] border p-6 text-left ${
        current === value ? "border-neel-900 bg-neel-50 ring-1 ring-neel-900" : "border-line-strong bg-white hover:border-ink"
      }`}
    >
      <Icon className="h-6 w-6 text-neel-800" />
      <span className="font-display text-[19px] font-bold">{title}</span>
      <span className="text-[14px] text-muted">{text}</span>
    </button>
  );
}

// Shown once after a Google sign-up: buyer or supplier?
export default function ChooseAccount() {
  const { user, saveSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user && user.role !== "user" && !busy) return <Navigate to={homeFor(user)} replace />;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/auth/select-role", { method: "POST", body: { role, companyName } });
      saveSession(data.token, data.user);
      toast(role === "supplier" ? "Supplier account ready" : "Buyer account ready");
      const from = location.state?.from;
      navigate(from && from !== "/choose-account" && role === "buyer" ? from : homeFor(data.user), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };


  return (
    <main className="container-page max-w-2xl py-14">
      <h1 className="text-[32px] font-bold">How will you use Vyapaar Bharat?</h1>
      <p className="mt-2 text-muted">This decides what your dashboard shows. Your requirements and quotes always stay linked to your account.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Option current={role} onSelect={setRole} value="buyer" icon={ShoppingCart} title="I want to buy" text="Post requirements and compare quotes from suppliers." />
        <Option current={role} onSelect={setRole} value="supplier" icon={Store} title="I want to sell" text="Get a company profile, list products and quote to buyers." />
      </div>
      {role === "supplier" && (
        <div className="mt-5">
          <Field label="Company name" htmlFor="company" hint="Shown on your supplier profile and on every quote you send.">
            <input id="company" className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </Field>
        </div>
      )}
      <div className="mt-5">
        <FormError>{error}</FormError>
      </div>
      <button className="btn btn-dark btn-lg mt-5" disabled={!role || busy || (role === "supplier" && !companyName.trim())} onClick={save}>
        {busy && <Spinner className="h-4 w-4 !text-white" />} Continue
      </button>
    </main>
  );
}
