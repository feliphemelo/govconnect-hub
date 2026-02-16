import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, personality, aiName, knowledgeBase } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const personalityPrompts: Record<string, string> = {
      normal: "Você é um assistente virtual governamental prestativo e objetivo.",
      formal: "Você é um assistente virtual governamental extremamente formal e protocolar. Use linguagem institucional.",
      casual: "Você é um assistente virtual governamental amigável e descontraído, mas sempre profissional.",
    };

    const systemPrompt = `${personalityPrompts[personality] || personalityPrompts.formal}
Seu nome é ${aiName || "Assistente"}.
Você trabalha para uma instituição pública e deve sempre ser respeitoso e informativo.
Responda em português do Brasil.
${knowledgeBase ? `\nBase de conhecimento disponível:\n${knowledgeBase}` : ""}
Se não souber a resposta, oriente o cidadão a procurar atendimento humano.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua solicitação.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
