import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  FileText,
  User,
  Package,
  Building2,
  Inbox,
  Send,
  Shield,
} from "lucide-react";
import logo from "../assets/vyapaarbharatlogo.png";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";

const LINKS = [
  { to: "/categories", label: "Categories" },
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/requirements", label: "Buyer requirements" },
  { to: "/insights", label: "Insights" },
];

function accountLinks(user) {
  if (!user) return [];
  if (["admin", "super_admin"].includes(user.role)) {
    return [
      { to: "/admin/dashboard", label: "Admin panel", icon: Shield },
      { to: "/my-profile", label: "My account", icon: User },
    ];
  }
  if (user.role === "supplier") {
    return [
      { to: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/my-quotes", label: "My quotes", icon: Send },
      { to: "/supplier/products", label: "My products", icon: Package },
      { to: "/supplier/enquiries", label: "Enquiries", icon: Inbox },
      { to: "/supplier/profile", label: "Company profile", icon: Building2 },
      { to: "/my-profile", label: "My account", icon: User },
    ];
  }
  return [
    { to: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/my-requirements", label: "My requirements", icon: FileText },
    { to: "/my-profile", label: "My account", icon: User },
  ];
}

export function Logo({ light = false }) {
  return (
    <Link
      to="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label="Vyapaar Bharat home"
    >
      <img
        src={logo}
        alt=""
        className="h-10 w-10 rounded-full bg-white object-contain"
      />
      <span className="leading-none">
        <span
          className={`block font-display text-[19px] font-bold tracking-tight ${light ? "text-white" : "text-neel-900"}`}
        >
          Vyapaar Bharat
        </span>
        <span
          lang="hi"
          className={`mt-0.5 block text-[12px] ${light ? "text-white/60" : "text-muted"}`}
        >
          व्यापार भारत
        </span>
      </span>
    </Link>
  );
}

function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const roleLabel = {
    supplier: "Supplier",
    buyer: "Buyer",
    user: "Buyer",
    admin: "Admin",
    super_admin: "Super admin",
  }[user.role];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 hover:bg-black/5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={user.name} size={34} />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block max-w-[140px] truncate text-[13.5px] font-semibold">
            {user.companyName || user.name}
          </span>
          <span className="block text-[12px] text-muted">{roleLabel}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => e.target.closest("a") && setOpen(false)}
          className="panel absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden p-1.5 shadow-[0_18px_40px_-18px_rgba(18,26,64,.35)]"
        >
          <div className="px-3 pb-2.5 pt-2">
            <div className="truncate font-semibold">{user.name}</div>
            <div className="truncate text-[13px] text-muted">{user.email}</div>
          </div>
          <div className="divider my-1" />
          {accountLinks(user).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] hover:bg-page"
            >
              <Icon className="h-4 w-4 text-muted" /> {label}
            </Link>
          ))}
          <div className="divider my-1" />
          <button
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-bad hover:bg-bad-bg"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isSupplier, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const primaryCta = isSupplier
    ? { to: "/requirements", label: "Find buyers" }
    : isAdmin
      ? { to: "/admin/dashboard", label: "Admin panel" }
      : { to: "/post-requirement", label: "Post requirement" };

  const navLink = ({ isActive }) =>
    `relative px-3 py-2 text-[14.5px] font-medium transition-colors ${isActive ? "text-neel-900" : "text-muted hover:text-ink"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container-page flex h-[68px] items-center gap-4">
        <Logo />

        <nav className="ml-6 hidden items-center lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLink}>
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full bg-haldi-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            to="/products"
            className="btn btn-ghost hidden !px-2.5 md:inline-flex"
            aria-label="Search products"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>

          {user ? (
            <>
              <Link
                to={primaryCta.to}
                className="btn btn-primary hidden sm:inline-flex"
              >
                {primaryCta.label}
              </Link>
              <AccountMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="btn btn-ghost hidden sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                to="/post-requirement"
                className="btn btn-primary hidden sm:inline-flex"
              >
                Post requirement
              </Link>
            </>
          )}

          <button
            className="btn btn-ghost !px-2.5 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-neel-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white"
            onClick={(e) => e.target.closest("a") && setMobileOpen(false)}
          >
            <div className="flex h-[68px] items-center justify-between border-b border-line px-5">
              <span className="font-display text-lg font-bold">Menu</span>
              <button
                className="btn btn-ghost !px-2.5"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-3 text-[16px] font-medium ${isActive ? "bg-neel-50 text-neel-900" : ""}`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {user && (
                <>
                  <div className="mx-3 mb-2 mt-5 text-[13px] text-muted">
                    Your account
                  </div>
                  {accountLinks(user).map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-3 ${isActive ? "bg-neel-50 text-neel-900" : ""}`
                      }
                    >
                      <Icon className="h-4 w-4 text-muted" /> {label}
                    </NavLink>
                  ))}
                </>
              )}
            </div>
            <div className="grid gap-2 border-t border-line p-4">
              <Link
                to={primaryCta.to}
                className="btn btn-primary btn-lg w-full"
              >
                {primaryCta.label}
              </Link>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-outline w-full"
                >
                  Log out
                </button>
              ) : (
                <Link to="/login" className="btn btn-outline w-full">
                  Log in or create account
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
