import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, Smartphone } from "lucide-react";
import SettingsWhatsApp from "@/components/settings/SettingsWhatsApp";
import SettingsWhatsAppSessions from "@/components/settings/SettingsWhatsAppSessions";

export default function Connections() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conexões WhatsApp</h1>
      <Tabs defaultValue="unofficial">
        <TabsList>
          <TabsTrigger value="unofficial" className="gap-1.5 text-xs">
            <Wifi className="h-3.5 w-3.5" /> API Não-Oficial
          </TabsTrigger>
          <TabsTrigger value="official" className="gap-1.5 text-xs">
            <Smartphone className="h-3.5 w-3.5" /> API Oficial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unofficial">
          <SettingsWhatsAppSessions />
        </TabsContent>

        <TabsContent value="official">
          <SettingsWhatsApp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
