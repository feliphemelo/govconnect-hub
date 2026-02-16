import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const NOTIFICAMEHUB_TOKEN = Deno.env.get("NOTIFICAMEHUB_TOKEN");
    if (!NOTIFICAMEHUB_TOKEN) throw new Error("NOTIFICAMEHUB_TOKEN not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { action, ...params } = await req.json();

    // Get company info
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    if (!profile) throw new Error("Profile not found");

    const BASE_URL = "https://api.notificame.com.br/v1";
    const headers = {
      "Authorization": `Bearer ${NOTIFICAMEHUB_TOKEN}`,
      "Content-Type": "application/json",
    };

    let result: any = {};

    switch (action) {
      case "send_template": {
        const { phone, template_name, template_language, components } = params;

        // Check credits
        const { data: company } = await supabase
          .from("companies")
          .select("credits_balance")
          .eq("id", profile.company_id)
          .single();

        if (!company || (company.credits_balance ?? 0) < 1) {
          throw new Error("Créditos insuficientes");
        }

        const resp = await fetch(`${BASE_URL}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "template",
            template: {
              name: template_name,
              language: { code: template_language || "pt_BR" },
              components: components || [],
            },
          }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(`NotificameHub error [${resp.status}]: ${JSON.stringify(data)}`);

        // Deduct credit
        await supabase.from("companies").update({
          credits_balance: (company.credits_balance ?? 0) - 1,
        }).eq("id", profile.company_id);

        await supabase.from("credit_transactions").insert({
          company_id: profile.company_id,
          type: "debit",
          amount: -1,
          description: `Mensagem template para ${phone}`,
          reference_id: data.messages?.[0]?.id,
        });

        result = data;
        break;
      }

      case "get_templates": {
        const resp = await fetch(`${BASE_URL}/templates`, { headers });
        const data = await resp.json();
        if (!resp.ok) throw new Error(`NotificameHub error [${resp.status}]: ${JSON.stringify(data)}`);
        result = data;
        break;
      }

      case "test_connection": {
        const resp = await fetch(`${BASE_URL}/account`, { headers });
        const data = await resp.json();
        result = { connected: resp.ok, data };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("NotificameHub error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
