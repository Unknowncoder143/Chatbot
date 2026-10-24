
export default async (request) => {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Use POST to send a chat message." },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    const { widgetId, question } = body;

    if (
      typeof widgetId !== "string" ||
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 4000
    ) {
      return Response.json(
        { error: "Invalid widget ID or question." },
        { status: 400 }
      );
    }

    const allowedIds = (process.env.ALLOWED_WIDGET_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!allowedIds.includes(widgetId)) {
      return Response.json(
        { error: "Unknown widget. Check ALLOWED_WIDGET_IDS." },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");

      return Response.json(
        { error: "Server configuration error: API key is missing." },
        { status: 500 }
      );
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
      // Log provider status, but never log the secret API key.
      console.error("OpenRouter HTTP status:", upstream.status);

      return Response.json(
        {
          error:
            upstream.status === 401
              ? "OpenRouter authentication failed. Check your API key."
              : upstream.status === 402
              ? "OpenRouter reports insufficient credits."
              : upstream.status === 429
              ? "Too many requests. Please try again later."
              : "OpenRouter request failed. Check the function logs."
        },
        { status: 502 }
      );
    }

    const result = await upstream.json();
    const reply = result.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      console.error("OpenRouter returned no text response");

      return Response.json(
        { error: "The AI did not return a text response." },
        { status: 502 }
      );
    }

    return Response.json(
      { reply },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Chat function error:", error.message);

    return Response.json(
      { error: "Request failed. Check the Netlify function logs." },
      { status: 500 }
    );
  }
};

export const config = {
  path: "/.netlify/functions/chat"
};
