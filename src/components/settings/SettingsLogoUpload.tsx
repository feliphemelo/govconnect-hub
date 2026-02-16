import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  companyId: string;
  currentLogoUrl: string | null;
  currentLoginLogoUrl: string | null;
  currentSidebarLogoUrl: string | null;
  onSaved: () => void;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const DEFAULT_LOGO = "/placeholder.svg";

function LogoSlot({
  label,
  description,
  currentUrl,
  onUpload,
  uploading,
}: {
  label: string;
  description: string;
  currentUrl: string | null;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Formato inválido. Use PNG, JPG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  };

  const displayUrl = preview || currentUrl || DEFAULT_LOGO;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg border border-border bg-muted/50 flex items-center justify-center overflow-hidden">
          {displayUrl !== DEFAULT_LOGO ? (
            <img src={displayUrl} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFile} disabled={uploading} />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? "Enviando..." : "Upload"}
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
}

export default function SettingsLogoUpload({ companyId, currentLogoUrl, currentLoginLogoUrl, currentSidebarLogoUrl, onSaved }: LogoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const uploadLogo = async (file: File, field: "logo_url" | "login_logo_url" | "sidebar_logo_url") => {
    setUploading(field);
    const ext = file.name.split(".").pop();
    const path = `${companyId}/${field}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("tenant-logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("tenant-logos").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("companies")
      .update({ [field]: publicUrl } as any)
      .eq("id", companyId);

    if (updateError) {
      toast({ title: "Erro ao salvar", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Logo atualizado com sucesso" });
      onSaved();
    }
    setUploading(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Logotipos
        </CardTitle>
        <CardDescription>
          Faça upload dos logotipos usados na plataforma. Formatos: PNG, JPG, WebP (máx. 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LogoSlot
          label="Logo Principal"
          description="Exibido no cabeçalho e nos relatórios PDF"
          currentUrl={currentLogoUrl}
          onUpload={(file) => uploadLogo(file, "logo_url")}
          uploading={uploading === "logo_url"}
        />
        <LogoSlot
          label="Logo da Tela de Login"
          description="Exibido na página de autenticação"
          currentUrl={currentLoginLogoUrl}
          onUpload={(file) => uploadLogo(file, "login_logo_url")}
          uploading={uploading === "login_logo_url"}
        />
        <LogoSlot
          label="Logo do Menu Lateral"
          description="Exibido na sidebar quando expandida"
          currentUrl={currentSidebarLogoUrl}
          onUpload={(file) => uploadLogo(file, "sidebar_logo_url")}
          uploading={uploading === "sidebar_logo_url"}
        />
      </CardContent>
    </Card>
  );
}
