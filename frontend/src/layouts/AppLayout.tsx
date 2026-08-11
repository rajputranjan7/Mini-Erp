import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
  { to: "/customers", label: "Customers", roles: ["ADMIN", "SALES", "ACCOUNTS"] },
  { to: "/products", label: "Products & Stock", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
  { to: "/challans", label: "Sales Challans", roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#F7F7F5]">
      <aside className="flex w-60 shrink-0 flex-col bg-ink text-slate-200">
        <div className="px-5 py-6">
          <p className="font-display text-lg font-semibold tracking-tight text-white">Mini ERP</p>
          <p className="text-xs text-slate-400">Operations Portal</p>
        </div>

        <nav className="flex-1 px-3">
          {NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `mb-1 flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="mb-3 font-mono text-[11px] text-slate-400">{user?.role}</p>
          <button
            onClick={logout}
            className="w-full rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
