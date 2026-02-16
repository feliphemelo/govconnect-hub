import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, Clock } from "lucide-react";
import SettingsSectors from "@/components/settings/SettingsSectors";
import SettingsUsers from "@/components/settings/SettingsUsers";
import SettingsHolidays from "@/components/settings/SettingsHolidays";
import SettingsBusinessHours from "@/components/settings/SettingsBusinessHours";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Tabs defaultValue="sectors">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="sectors" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" /> Setores</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="holidays" className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" /> Feriados</TabsTrigger>
          <TabsTrigger value="hours" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" /> Expediente</TabsTrigger>
        </TabsList>

        <TabsContent value="sectors"><SettingsSectors /></TabsContent>
        <TabsContent value="users"><SettingsUsers /></TabsContent>
        <TabsContent value="holidays"><SettingsHolidays /></TabsContent>
        <TabsContent value="hours"><SettingsBusinessHours /></TabsContent>
      </Tabs>
    </div>
  );
}
