"use client";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, CreditCard, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos",    label: "Alunos",    icon: Users },
  { href: "/pagamentos",label: "Pagamentos",icon: CreditCard },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-secondary min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-accent">🥋 Budo</span>Manager
        </h1>
        {user && (
          <p className="text-xs text-white/50 mt-1">{user.nome} · {user.role}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
                }
              `}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/60 hover:text-red-400 text-sm transition-colors w-full px-4 py-2 rounded-lg hover:bg-white/5"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
