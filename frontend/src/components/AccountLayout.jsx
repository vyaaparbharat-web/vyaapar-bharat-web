import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, FileText, PlusCircle, User, Send, Package, Inbox, Building2, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BUYER = [
  { to: "/buyer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/my-requirements", label: "My requirements", icon: FileText },
  { to: "/post-requirement", label: "Post requirement", icon: PlusCircle },
  { to: "/my-profile", label: "My account", icon: User },
];

const SUPPLIER = [
  { to: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requirements", label: "Find buyers", icon: Search },
  { to: "/my-quotes", label: "My quotes", icon: Send },
  { to: "/supplier/products", label: "My products", icon: Package },
  { to: "/supplier/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/supplier/profile", label: "Company profile", icon: Building2 },
  { to: "/my-profile", label: "My account", icon: User },
];

// Logged-in area for buyers and suppliers: side menu + page
export default function AccountLayout() {
  const { user, isSupplier, isAdmin } = useAuth();
  const items = isSupplier ? SUPPLIER : isAdmin ? [{ to: "/admin/dashboard", label: "Admin panel", icon: LayoutDashboard }, BUYER[3]] : BUYER;

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[232px_1fr] lg:py-10">
      <aside className="lg:sticky lg:top-[92px] lg:self-start">
        <div className="mb-4 hidden px-3 lg:block">
          <div className="truncate font-display text-[17px] font-bold">{user?.companyName || user?.name}</div>
          <div className="text-[13px] text-muted">{isSupplier ? "Supplier account" : isAdmin ? "Admin" : "Buyer account"}</div>
        </div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible" aria-label="Account">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium transition-colors ${
                  isActive ? "bg-neel-900 text-white" : "text-muted hover:bg-white hover:text-ink"
                }`
              }
            >
              <Icon className="h-[17px] w-[17px]" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
