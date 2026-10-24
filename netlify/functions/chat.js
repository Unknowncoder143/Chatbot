const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

export default async (request) => {
  // Browser CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Use POST to send a chat message." }, 405);
  }

  try {
    const body = await request.json();
    const { widgetId, question } = body || {};

    if (
      typeof widgetId !== "string" ||
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 4000
    ) {
      return json({ error: "Invalid widget ID or question." }, 400);
    }

    const allowedIds = (process.env.ALLOWED_WIDGET_IDS || "")
      .split(",")
      .map(id => id.trim())
      .filter(Boolean);

    if (!allowedIds.includes(widgetId)) {
      return json({ error: "Unknown widget. Check ALLOWED_WIDGET_IDS." }, 403);
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");
      return json({ error: "Server API key is not configured." }, 500);
    }

    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-Title": "WebVibe AI"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful website assistant."
            },
            {
              role: "user",
              content: question.trim()
            }
          ],
          max_tokens: 500
        })
      }
    );

    if (!upstream.ok) {
      console.error("OpenRouter HTTP status:", upstream.status);

      if (upstream.status === 401) {
        return json({ error: "OpenRouter API key is invalid." }, 502);
      }

      if (upstream.status === 402) {
        return json({ error: "OpenRouter account has insufficient credits." }, 502);
      }

      if (upstream.status === 429) {
        return json({ error: "Rate limit reached. Please try again later." }, 502);
      }

      return json({ error: "OpenRouter request failed. Check Netlify function logs." }, 502);
    }

    const result = await upstream.json();
    const reply = result.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      console.error("OpenRouter returned no text response");
      return json({ error: "The AI returned no text response." }, 502);
    }

    return json({ reply });

  } catch (error) {
    console.error("Chat function error:", error);
    return json({ error: "Chat request failed. Check the function logs." }, 500);
  }
};

export const config = {
  path: "/.netlify/functions/chat"
};
