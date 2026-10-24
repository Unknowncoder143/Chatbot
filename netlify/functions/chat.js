
export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { widgetId, question } = await request.json();

    if (
      typeof widgetId !== "string" ||
      typeof question !== "string" ||
      question.trim().length === 0 ||
      question.length > 4000
    ) {
      return Response.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    // Replace this example with a database lookup.
    // Never trust a widget ID as proof of payment or ownership.
    const allowedWidgetIds = (process.env.ALLOWED_WIDGET_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!allowedWidgetIds.includes(widgetId)) {
      return Response.json(
        { error: "Unknown widget" },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful website assistant."
            },
            { role: "user", content: question.trim() }
          ],
          max_tokens: 500
        })
      }
    );

    if (!upstream.ok) {
      return Response.json(
        { error: "AI provider request failed" },
        { status: 502 }
      );
    }

    const result = await upstream.json();
    const reply =
      result.choices?.[0]?.message?.content ??
      "No response received.";

    return Response.json(
      { reply },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return Response.json(
      { error: "Invalid request or server error" },
      { status: 400 }
    );
  }
};

export const config = {
  path: "/.netlify/functions/chat"
};
