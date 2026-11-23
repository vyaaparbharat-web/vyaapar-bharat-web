import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  Eye,
  EyeOff,
  ShoppingCart,
  Store,
  Check,
  Mail,
  Smartphone,
  ShieldCheck,
  KeyRound,
  MessageSquareText,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { homeFor } from "../lib/roles";
import { useToast } from "../context/ToastContext";
import { Field, FormError, Spinner } from "../components/ui";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

const PERKS = {
  buyer: [
    "Post requirements for free",
    "Get quotes from verified suppliers",
    "Only you see the quotes you receive",
  ],
  supplier: [
    "A company profile in the supplier directory",
    "See buyer requirements in your trade",
    "Send quotes and track every deal",
  ],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;

function RoleOption({ value, current, onChange, icon: Icon, title, text }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={active}
      className={`relative flex items-start gap-3 rounded-[12px] border p-3.5 text-left transition-colors ${
        active
          ? "border-neel-900 bg-neel-50 ring-1 ring-neel-900"
          : "border-line-strong bg-white hover:border-ink"
      }`}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-neel-800" : "text-muted"}`}
      />
      <span>
        <span className="block text-[14.5px] font-semibold">{title}</span>
        <span className="block text-[12.5px] text-muted">{text}</span>
      </span>
    </button>
  );
}

function ChannelOption({ value, current, onChange, icon: Icon, title, text }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-[12px] border p-3 text-left transition-colors ${
        active
          ? "border-neel-900 bg-neel-50 ring-1 ring-neel-900"
          : "border-line-strong bg-white hover:border-ink"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${active ? "text-neel-800" : "text-muted"}`}
      />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="block truncate text-[12.5px] text-muted">{text}</span>
      </span>
    </button>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, show, onToggle }) {
  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={show ? "text" : "password"}
        className="input pr-12"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-1.5 top-1.5 grid h-8 w-9 place-items-center rounded-md text-muted hover:bg-page"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// Shared "enter the 6-digit code" step (sign-up and login with code)
function CodeStep({
  title,
  sentTo,
  code,
  setCode,
  onSubmit,
  submitLabel,
  busy,
  error,
  resendIn,
  onResend,
  onBack,
  backLabel,
}) {
  return (
    <>
      <div className="mt-7 grid h-12 w-12 place-items-center rounded-full bg-neel-50 text-neel-700">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-[30px] font-bold">{title}</h1>
      <p className="mt-1 text-muted">
        {sentTo || "We sent you a 6-digit code"}. It's valid for 10 minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4" noValidate>
        <Field label="6-digit code" htmlFor="otp">
          <input
            id="otp"
            className="input num !h-14 text-center font-display !text-[28px] font-bold tracking-[0.5em]"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••"
          />
        </Field>

        <FormError>{error}</FormError>

        <button
          className="btn btn-primary btn-lg w-full"
          disabled={busy || code.length !== 6}
        >
          {busy && <Spinner className="h-4 w-4" />} {submitLabel}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[14px]">
          <button type="button" className="link" onClick={onBack}>
            {backLabel}
          </button>
          {resendIn > 0 ? (
            <span className="num text-muted">Resend code in {resendIn}s</span>
          ) : (
            <button
              type="button"
              className="link"
              onClick={onResend}
              disabled={busy}
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </>
  );
}

export default function Login() {
  const { user, saveSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const mode = params.get("mode") === "register" ? "register" : "login";
  const [role, setRole] = useState(
    params.get("role") === "supplier" ? "supplier" : "buyer",
  );
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    phone: "",
    city: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Login: "password" or "code" (OTP to email / mobile)
  const [loginMethod, setLoginMethod] = useState("password");
  const [identifier, setIdentifier] = useState("");

  // Code step, shared by sign-up and login with code
  const [step, setStep] = useState("details"); // "details" | "code"
  const [verifyVia, setVerifyVia] = useState("email");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const from = location.state?.from;
  if (user && !busy)
    return (
      <Navigate
        to={user.role === "user" ? "/choose-account" : from || homeFor(user)}
        replace
      />
    );

  const backToDetails = () => {
    setError("");
    setStep("details");
    setCode("");
  };
  const setMode = (m) => {
    backToDetails();
    setParams(
      m === "register"
        ? { mode: "register", ...(role === "supplier" ? { role } : {}) }
        : {},
      { replace: true, state: location.state },
    );
  };
  const chooseLoginMethod = (m) => {
    backToDetails();
    setLoginMethod(m);
  };
  const set = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const finish = (data, message) => {
    saveSession(data.token, data.user);
    toast(message || `Welcome, ${data.user.name.split(" ")[0]}`);
    if (data.needsRoleSelection)
      return navigate("/choose-account", { replace: true, state: { from } });
    // Only go back to a page this account type can open
    const target =
      from &&
      !(
        data.user.role === "supplier" &&
        /^\/(post-requirement|my-requirements|buyer)/.test(from)
      )
        ? from
        : homeFor(data.user);
    navigate(target, { replace: true });
  };

  // Runs an API call with busy/error handling. Keeps "busy" on success when we navigate away.
  const run = async (fn, { keepBusy = false } = {}) => {
    setError("");
    setBusy(true);
    try {
      await fn();
      if (!keepBusy) setBusy(false);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const codeSent = (data) => {
    setSentTo(data.message);
    setResendIn(data.resendInSec || 60);
    setStep("code");
    setCode("");
  };

  // ---------- login with password ----------
  const loginWithPassword = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(form.email.trim()) || !form.password)
      return setError("Enter your email and password.");
    run(
      async () => {
        const data = await api("/api/auth/login", {
          method: "POST",
          body: { email: form.email, password: form.password },
        });
        finish(data);
      },
      { keepBusy: true },
    );
  };

  // ---------- login with code ----------
  const sendLoginCode = (e) => {
    e?.preventDefault();
    const value = identifier.trim();
    if (!(EMAIL_RE.test(value) || PHONE_RE.test(value)))
      return setError("Enter a valid email or 10-digit mobile number.");
    run(async () =>
      codeSent(
        await api("/api/auth/login/send-otp", {
          method: "POST",
          body: { identifier: value },
        }),
      ),
    );
  };

  const loginWithCode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    run(
      async () => {
        const data = await api("/api/auth/login/verify-otp", {
          method: "POST",
          body: { identifier: identifier.trim(), otp: code },
        });
        finish(data);
      },
      { keepBusy: true },
    );
  };

  // ---------- sign-up step 1: check details, send code ----------
  const checkDetails = () => {
    if (!form.name.trim()) return "Enter your full name.";
    if (role === "supplier" && !form.companyName.trim())
      return "Enter your company name.";
    if (!EMAIL_RE.test(form.email.trim()))
      return "Enter a valid email address.";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim()))
      return "Enter a valid 10-digit mobile number.";
    if (verifyVia === "phone" && !form.phone.trim())
      return "Enter your mobile number to get the code by SMS.";
    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      return "Password must be at least 8 characters and include a letter and a number.";
    }
    return "";
  };

  const sendSignupCode = (e) => {
    e?.preventDefault();
    const problem = checkDetails();
    if (problem) return setError(problem);
    run(async () =>
      codeSent(
        await api("/api/auth/send-otp", {
          method: "POST",
          body: { channel: verifyVia, email: form.email, phone: form.phone },
        }),
      ),
    );
  };

  // ---------- sign-up step 2: verify code, create account ----------
  const register = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
    run(
      async () => {
        const data = await api("/api/auth/register", {
          method: "POST",
          body: { ...form, role, verifyVia, otp: code },
        });
        finish(data, "Account created");
      },
      { keepBusy: true },
    );
  };

  const google = (credentialResponse) =>
    run(
      async () => {
        const data = await api("/api/auth/google", {
          method: "POST",
          body: { credential: credentialResponse.credential },
        });
        finish(data);
      },
      { keepBusy: true },
    );

  const perkRole = mode === "register" ? role : "buyer";
  const onCodeStep = step === "code";

  return (
    <main className="container-page py-10 lg:py-16">
      <div className="mx-auto grid max-w-[980px] overflow-hidden rounded-[20px] border border-line bg-white lg:grid-cols-[1fr_380px]">
        <div className="p-6 sm:p-10">
          <div
            className="inline-flex rounded-[12px] bg-page p-1"
            role="tablist"
          >
            {[
              ["login", "Log in"],
              ["register", "Create account"],
            ].map(([m, label]) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-[9px] px-4 py-2 text-[14px] font-semibold ${mode === m ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {onCodeStep ? (
            mode === "login" ? (
              <CodeStep
                title="Enter the code"
                sentTo={sentTo}
                code={code}
                setCode={setCode}
                onSubmit={loginWithCode}
                submitLabel="Verify and log in"
                busy={busy}
                error={error}
                resendIn={resendIn}
                onResend={sendLoginCode}
                onBack={backToDetails}
                backLabel="Use a different email or number"
              />
            ) : (
              <CodeStep
                title="Enter the code"
                sentTo={sentTo}
                code={code}
                setCode={setCode}
                onSubmit={register}
                submitLabel="Verify and create account"
                busy={busy}
                error={error}
                resendIn={resendIn}
                onResend={sendSignupCode}
                onBack={backToDetails}
                backLabel="Change details"
              />
            )
          ) : (
            <>
              <h1 className="mt-7 text-[30px] font-bold">
                {mode === "login" ? "Welcome back" : "Create your free account"}
              </h1>
              <p className="mt-1 text-muted">
                {mode === "login"
                  ? "Log in to manage your requirements and quotes."
                  : "We'll send a 6-digit code to confirm it's really you."}
              </p>

                          {/* Google: one tap, email already verified by Google */}
              {GOOGLE_ENABLED && (
                <>
                  <div className="mt-6 flex flex-col items-center gap-2.5">
                    <GoogleLogin
                      onSuccess={google}
                      onError={() => setError("Google sign-in was cancelled or failed.")}
                      text={mode === "login" ? "signin_with" : "signup_with"}
                      theme="outline"
                      size="large"
                      shape="rectangular"
                      logo_alignment="left"
                      width="320"
                    />
                    <p className="text-[13px] text-subtle">Continue securely with your Google account</p>
                  </div>
                  <div className="my-6 flex items-center gap-3 text-[13px] text-subtle">
                    <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
                  </div>
                </>
              )}

              {mode === "login" ? (
                <>
                  <div
                    className={`${GOOGLE_ENABLED ? "" : "mt-7"} grid grid-cols-2 gap-2`}
                  >
                    <ChannelOption
                      value="password"
                      current={loginMethod}
                      onChange={chooseLoginMethod}
                      icon={KeyRound}
                      title="Password"
                      text="Email and password"
                    />
                    <ChannelOption
                      value="code"
                      current={loginMethod}
                      onChange={chooseLoginMethod}
                      icon={MessageSquareText}
                      title="OTP"
                      text="Code to email or mobile"
                    />
                  </div>

                  {loginMethod === "password" ? (
                    <form
                      onSubmit={loginWithPassword}
                      className="mt-5 grid gap-4"
                      noValidate
                    >
                      <Field label="Email" htmlFor="email">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="input"
                          value={form.email}
                          onChange={set}
                          autoComplete="email"
                        />
                      </Field>
                      <Field label="Password" htmlFor="password">
                        <PasswordInput
                          id="password"
                          value={form.password}
                          onChange={set}
                          autoComplete="current-password"
                          show={showPassword}
                          onToggle={() => setShowPassword((s) => !s)}
                        />
                      </Field>
                      <FormError>{error}</FormError>
                      <button
                        className="btn btn-dark btn-lg mt-1 w-full"
                        disabled={busy}
                      >
                        {busy && <Spinner className="h-4 w-4 !text-white" />}{" "}
                        Log in
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={sendLoginCode}
                      className="mt-5 grid gap-4"
                      noValidate
                    >
                      <Field
                        label="Email or mobile number"
                        htmlFor="identifier"
                        hint="We'll send a 6-digit code there."
                      >
                        <input
                          id="identifier"
                          className="input"
                          value={identifier}
                          onChange={(e) => {
                            setError("");
                            setIdentifier(e.target.value);
                          }}
                          autoComplete="username"
                          placeholder="name@company.com or 98765 43210"
                        />
                      </Field>
                      <FormError>{error}</FormError>
                      <button
                        className="btn btn-dark btn-lg mt-1 w-full"
                        disabled={busy}
                      >
                        {busy && <Spinner className="h-4 w-4 !text-white" />}{" "}
                        Send code
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <form
                  onSubmit={sendSignupCode}
                  className={`${GOOGLE_ENABLED ? "" : "mt-7"} grid gap-4`}
                  noValidate
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <RoleOption
                      value="buyer"
                      current={role}
                      onChange={setRole}
                      icon={ShoppingCart}
                      title="I want to buy"
                      text="Post requirements, get quotes"
                    />
                    <RoleOption
                      value="supplier"
                      current={role}
                      onChange={setRole}
                      icon={Store}
                      title="I want to sell"
                      text="List products, quote to buyers"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" htmlFor="name">
                      <input
                        id="name"
                        name="name"
                        className="input"
                        value={form.name}
                        onChange={set}
                        autoComplete="name"
                      />
                    </Field>
                    <Field
                      label="Company name"
                      htmlFor="companyName"
                      optional={role === "buyer"}
                    >
                      <input
                        id="companyName"
                        name="companyName"
                        className="input"
                        value={form.companyName}
                        onChange={set}
                        autoComplete="organization"
                      />
                    </Field>
                    <Field label="Email" htmlFor="email">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="input"
                        value={form.email}
                        onChange={set}
                        autoComplete="email"
                      />
                    </Field>
                    <Field
                      label="Mobile number"
                      htmlFor="phone"
                      optional={verifyVia === "email"}
                    >
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        className="input"
                        value={form.phone}
                        onChange={set}
                        autoComplete="tel"
                        placeholder="98765 43210"
                      />
                    </Field>
                    <Field label="City" htmlFor="city" optional>
                      <input
                        id="city"
                        name="city"
                        className="input"
                        value={form.city}
                        onChange={set}
                        autoComplete="address-level2"
                        placeholder="Ludhiana"
                      />
                    </Field>
                    <Field
                      label="Password"
                      htmlFor="password"
                      hint="8+ characters, with a letter and a number."
                    >
                      <PasswordInput
                        id="password"
                        value={form.password}
                        onChange={set}
                        autoComplete="new-password"
                        show={showPassword}
                        onToggle={() => setShowPassword((s) => !s)}
                      />
                    </Field>
                  </div>

                  <div>
                    <span className="label">Send the code to</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ChannelOption
                        value="email"
                        current={verifyVia}
                        onChange={setVerifyVia}
                        icon={Mail}
                        title="Email"
                        text={form.email || "Your email address"}
                      />
                      <ChannelOption
                        value="phone"
                        current={verifyVia}
                        onChange={setVerifyVia}
                        icon={Smartphone}
                        title="Mobile (SMS)"
                        text={form.phone || "Your mobile number"}
                      />
                    </div>
                  </div>

                  <FormError>{error}</FormError>

                  <button
                    className="btn btn-dark btn-lg mt-1 w-full"
                    disabled={busy}
                  >
                    {busy && <Spinner className="h-4 w-4 !text-white" />} Send
                    verification code
                  </button>
                </form>
              )}
            </>
          )}

          <p className="mt-7 text-center text-[14px] text-muted">
            {mode === "login" ? (
              <>
                New to Vyapaar Bharat?{" "}
                <button className="link" onClick={() => setMode("register")}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button className="link" onClick={() => setMode("login")}>
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        <aside className="hidden flex-col justify-between bg-neel-900 p-10 text-white lg:flex">
          <div>
            <p
              lang="hi"
              className="deva text-[22px] font-medium text-haldi-500"
            >
              {perkRole === "supplier"
                ? "नए ग्राहक, हर दिन।"
                : "सही दाम, भरोसेमंद सप्लायर।"}
            </p>
            <h2 className="mt-3 text-[26px] font-bold leading-tight text-white">
              {perkRole === "supplier"
                ? "Sell to buyers across India"
                : "Buy smarter from suppliers across India"}
            </h2>
            <ul className="mt-8 space-y-4">
              {PERKS[perkRole].map((p) => (
                <li key={p} className="flex gap-3 text-[15px] text-white/80">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-haldi-500" />{" "}
                  {p}
                </li>
              ))}
              <li className="flex gap-3 text-[15px] text-white/80">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-haldi-500" />{" "}
                Every account is verified by email or mobile
              </li>
            </ul>
          </div>
          <p className="text-[13px] text-white/50">
            By continuing you agree to our terms. Need help?{" "}
            <a href="mailto:info@vyapaarbharat.com" className="underline">
              info@vyapaarbharat.com
            </a>
          </p>
        </aside>
      </div>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        <Link to="/" className="hover:text-ink">
          Back to home
        </Link>
      </p>
    </main>
  );
}
