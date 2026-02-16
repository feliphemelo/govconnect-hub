import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, Clock, Paintbrush, Smartphone, Brain } from "lucide-react";
import SettingsSectors from "@/components/settings/SettingsSectors";
import SettingsUsers from "@/components/settings/SettingsUsers";
import SettingsHolidays from "@/components/settings/SettingsHolidays";
import SettingsBusinessHours from "@/components/settings/SettingsBusinessHours";
import SettingsWhiteLabel from "@/components/settings/SettingsWhiteLabel";
import SettingsWhatsApp from "@/components/settings/SettingsWhatsApp";
import SettingsAIProvider from "@/components/settings/SettingsAIProvider";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Tabs defaultValue="whitelabel">
        <TabsList className="grid w-full grid-cols-7 max-w-4xl">
          <TabsTrigger value="whitelabel" className="gap-1.5 text-xs"><Paintbrush className="h-3.5 w-3.5" /> White-label</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5 text-xs"><Smartphone className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs"><Brain className="h-3.5 w-3.5" /> IA</TabsTrigger>
          <TabsTrigger value="sectors" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Setores</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="holidays" className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> Feriados</TabsTrigger>
          <TabsTrigger value="hours" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Expediente</TabsTrigger>
        </TabsList>

        <TabsContent value="whitelabel"><SettingsWhiteLabel /></TabsContent>
        <TabsContent value="whatsapp"><SettingsWhatsApp /></TabsContent>
        <TabsContent value="ai"><SettingsAIProvider /></TabsContent>
        <TabsContent value="sectors"><SettingsSectors /></TabsContent>
        <TabsContent value="users"><SettingsUsers /></TabsContent>
        <TabsContent value="holidays"><SettingsHolidays /></TabsContent>
        <TabsContent value="hours"><SettingsBusinessHours /></TabsContent>
      </Tabs>
    </div>
  );
}
