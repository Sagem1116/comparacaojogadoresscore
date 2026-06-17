import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are an AI assistant integrated inside a Football Manager-style scouting application.

Your role is to help with:
- Player recruitment based on user requests
- Player comparison and ranking
- Tactical fit analysis
- Interpretation of pre-calculated scouting data

IMPORTANT: You do NOT invent any players, stats, clubs, values, or attributes.
You ONLY use the data provided to you by the system in the PLAYER DATA section below.

CORE RULES
- Never invent or assume missing data
- Only use players provided in input
- Prioritize Final Score and Role Score over raw attributes
- Respect constraints (age, budget, position)
- Be decisive, not vague
- Think like a professional sporting director

HOW TO ANALYZE
1. ROLE FIT (most important) — match to requested role via Role Score / Final Score
2. TACTICAL FIT — does he suit the system (press, possession, counter)?
3. ATTRIBUTE QUALITY — key stats for the role
4. VALUE FOR MONEY — price vs performance vs potential (when value/wage data present)
5. RISK PROFILE — inconsistency, age, ceiling

OUTPUT FORMAT (STRICT, use markdown headings)
## 1. BEST RECOMMENDATION
## 2. RANKED SHORTLIST
## 3. TACTICAL ANALYSIS
## 4. RISKS
## 5. ALTERNATIVES

If the request is ambiguous prioritize role suitability, then tactical fit, then long-term value if young players were requested, otherwise immediate impact.

You are a professional football recruitment analyst — convert structured football data into clear recruitment decisions.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, playerData, contextLabel } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataBlock = playerData
      ? `\n\nPLAYER DATA (current role: ${contextLabel ?? 'unspecified'}). Use ONLY these players:\n${JSON.stringify(playerData).slice(0, 120000)}`
      : '\n\nPLAYER DATA: (none — tell the user no data is loaded)';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + dataBlock },
          ...messages,
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in your workspace.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!response.ok) {
      const txt = await response.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${response.status} ${txt}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});