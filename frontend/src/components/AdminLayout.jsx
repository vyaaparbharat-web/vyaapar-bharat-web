import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, Package, FileText, Send, Users, Newspaper, Inbox, LogOut, Menu, X, ExternalLink } from "lucide-react";
import logo from "../assets/vyapaarbharatlogo.png";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/requirements", label: "Requirements", icon: FileText },
  { to: "/admin/quotes", label: "Quotes", icon: Send },
  { to: "/admin/companies", label: "Companies", icon: Building2 },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox },
  { to: "/admin/insights", label: "Insights", icon: Newspaper },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col bg-neel-950 text-white/75">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        <img src={logo} alt="" className="h-9 w-9 rounded-full bg-white object-contain" />
        <span className="leading-tight">
          <span className="block font-display text-[16px] font-bold text-white">Vyapaar Bharat</span>
          <span className="block text-[12px] text-white/50">Admin</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Admin">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium ${isActive ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-[17px] w-[17px] ${isActive ? "text-haldi-500" : ""}`} /> {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" /> View website
        </Link>
        <div className="mt-1 flex items-center gap-3 px-3 py-2">
          <Avatar name={user?.name} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-white">{user?.name}</div>
            <div className="truncate text-[12px] text-white/50">{user?.role === "super_admin" ? "Super admin" : "Admin"}</div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="rounded-lg p-2 hover:bg-white/10 hover:text-white"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className="flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <span className="font-display font-bold">Admin</span>
        <button className="btn btn-ghost !px-2.5" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72" onClick={(e) => e.target.closest("a") && setOpen(false)}>
            {sidebar}
            <button className="absolute right-3 top-5 text-white/70" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
