import { Bell } from "lucide-react";

export default function NotificationSystem() {
  // Stub - notificações desabilitadas por enquanto
  return (
    <button className="relative p-2 hover:bg-accent rounded-md" title="Notificações">
      <Bell className="w-5 h-5" />
    </button>
  );
}
