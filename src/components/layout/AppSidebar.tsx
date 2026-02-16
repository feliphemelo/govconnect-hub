import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Users,
  BarChart3,
  Settings,
  Send,
  FileSignature,
  CreditCard,
  Webhook,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ClipboardList,
  ShieldCheck,
  Plug,
  MessagesSquare,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", minRole: null },
  { to: "/chat", icon: MessageSquare, label: "Atendimento", minRole: null },
  { to: "/internal-chat", icon: MessagesSquare, label: "Chat Interno", minRole: null },
  { to: "/contacts", icon: Users, label: "Contatos", minRole: null },
  { to: "/chatbot", icon: Bot, label: "Chatbot", minRole: null },
  { to: "/flow-builder", icon: GitBranch, label: "Fluxos", minRole: null },
  { to: "/groups", icon: MessageCircle, label: "Grupos", minRole: null },
  { to: "/broadcasts", icon: Send, label: "Disparos", minRole: null },
  { to: "/polls", icon: ClipboardList, label: "Enquetes", minRole: null },
  { to: "/signatures", icon: FileSignature, label: "Assinaturas", minRole: null },
  { to: "/reports", icon: BarChart3, label: "Relatórios", minRole: null },
  { to: "/credits", icon: CreditCard, label: "Créditos", minRole: null },
  { to: "/connections", icon: Plug, label: "Conexões", minRole: null },
  { to: "/webhooks", icon: Webhook, label: "Webhooks", minRole: "admin" as const },
  { to: "/superadmin", icon: ShieldCheck, label: "SuperAdmin", minRole: "admin" as const },
  { to: "/settings", icon: Settings, label: "Configurações", minRole: null },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, isAdmin } = useUserRole();

  const visibleItems = navItems.filter((item) => {
    if (!item.minRole) return true;
    if (item.minRole === "admin") return isAdmin;
    return true;
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r transition-all duration-300",
        "bg-sidebar text-sidebar-foreground border-sidebar-border",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-sidebar-primary">
            GovChat
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
