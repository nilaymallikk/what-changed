import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { zip, city, state, changes } = await req.json();

    if (!changes || !Array.isArray(changes)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'changes' array in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      console.warn("OPENROUTER_API_KEY environment variable is not set.");
      // Fallback deterministic output when key is not configured
      return new Response(
        JSON.stringify({
          headline: `Neighborhood Activity Update for ${city || zip}, ${state || 'US'}`,
          summary: `Detected ${changes.length} place update(s) across OpenStreetMap snapshots.`,
          highlights: changes.slice(0, 3).map((c: any) => ({
            title: c.title,
            description: c.description,
            importance: c.significance_score || 50,
            change_ids: [c.id]
          }))
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert local news interpreter analyzing geographic change data for neighborhood zip code ${zip} (${city}, ${state}).
Your task is to produce a structured JSON summary based strictly on the provided detected changes.

STRICT RULES:
1. Only use supplied information. Never invent facts, dates, addresses, or businesses.
2. Never claim an OpenStreetMap (OSM) disappearance proves a business closed. State only that it is no longer listed in the latest snapshot.
3. Group related changes logically.
4. Prioritize meaningful changes (higher significance scores).
5. Output ONLY valid JSON matching this structure exactly (no markdown formatting, no code blocks):
{
  "headline": "Short punchy summary (max 10 words)",
  "summary": "2-3 sentence clear paragraph detailing the local changes.",
  "highlights": [
    {
      "title": "Short title",
      "description": "1-2 sentence description",
      "importance": 85,
      "change_ids": ["change_id_here"]
    }
  ]
}`;

    const userPrompt = `Here are the detected changes for ${city}, ${state} (${zip}):
${JSON.stringify(changes, null, 2)}

Produce the JSON summary now.`;

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://whatchangedaroundme.app",
        "X-Title": "What Changed Around Me"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!openRouterResponse.ok) {
      const errText = await openRouterResponse.text();
      console.error("OpenRouter API error:", errText);
      throw new Error(`OpenRouter returned status ${openRouterResponse.status}`);
    }

    const data = await openRouterResponse.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    
    // Parse cleaned JSON from content
    let parsedResult;
    try {
      const cleanContent = rawContent.replace(/```json\n?|\n?```/g, "").trim();
      parsedResult = JSON.parse(cleanContent);
    } catch {
      parsedResult = {
        headline: `Recent changes in ${city || zip}`,
        summary: rawContent.slice(0, 300) || "No detailed summary available.",
        highlights: []
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Failed to generate AI summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
