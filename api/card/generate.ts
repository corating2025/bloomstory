interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isSafeRemoteImageUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      host === "169.254.169.254" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function generateCustomSvg(
  style: string = "",
  sticker: string = "",
  recipient: string = ""
): string {
  const styleLower = style.toLowerCase();
  const stickerLower = sticker.toLowerCase();
  const safeRecipient = escapeXml(recipient.toUpperCase().slice(0, 40));

  let bgGradient = {
    start: "#fff5f5",
    end: "#fef2f2",
    accent: "#fecdd3",
    border: "#fda4af",
    leafColor: "#fb7185",
  };

  if (
    styleLower.includes("pink") ||
    styleLower.includes("purple") ||
    styleLower.includes("violet") ||
    styleLower.includes("lavender")
  ) {
    bgGradient = {
      start: "#fff1f2",
      end: "#f5f3ff",
      accent: "#fbcfe8",
      border: "#f472b6",
      leafColor: "#c084fc",
    };
  } else if (
    styleLower.includes("sunset") ||
    styleLower.includes("orange") ||
    styleLower.includes("peach") ||
    styleLower.includes("warm") ||
    styleLower.includes("red") ||
    styleLower.includes("coral")
  ) {
    bgGradient = {
      start: "#fff5f5",
      end: "#fef3c7",
      accent: "#fed7aa",
      border: "#fb923c",
      leafColor: "#f59e0b",
    };
  } else if (
    styleLower.includes("floral") ||
    styleLower.includes("green") ||
    styleLower.includes("yellow") ||
    styleLower.includes("garden") ||
    styleLower.includes("leaf") ||
    styleLower.includes("nature")
  ) {
    bgGradient = {
      start: "#f0fdf4",
      end: "#fefce8",
      accent: "#bbf7d0",
      border: "#86efac",
      leafColor: "#22c55e",
    };
  } else if (
    styleLower.includes("blue") ||
    styleLower.includes("sky") ||
    styleLower.includes("ocean") ||
    styleLower.includes("cold") ||
    styleLower.includes("cool")
  ) {
    bgGradient = {
      start: "#ecfeff",
      end: "#eff6ff",
      accent: "#bae6fd",
      border: "#60a5fa",
      leafColor: "#38bdf8",
    };
  }

  let stickerElement = `
    <g transform="translate(460, 460)">
      <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 L -21,34 L -15,10 L -34,-7 L -10,-10 Z" fill="#f59e0b" />
      <circle cx="0" cy="0" r="4" fill="#ffffff" opacity="0.9" />
    </g>
  `;

  if (stickerLower.includes("cat") || stickerLower.includes("kitty")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <ellipse cx="0" cy="8" rx="32" ry="22" fill="#fbcfe8" />
        <circle cx="0" cy="-12" r="22" fill="#fbcfe8" />
        <polygon points="-18,-24 -8,-10 -22,-6" fill="#f9a8d4" />
        <polygon points="18,-24 8,-10 22,-6" fill="#f9a8d4" />
        <path d="M -12,-12 Q -8,-15 -4,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 4,-12 Q 8,-15 12,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
      </g>
    `;
  } else if (stickerLower.includes("sun") || stickerLower.includes("sunshine")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <circle cx="0" cy="0" r="28" fill="#fbbf24" />
        <circle cx="0" cy="0" r="25" fill="#fef08a" />
        <circle cx="-8" cy="-4" r="3" fill="#78350f" />
        <circle cx="8" cy="-4" r="3" fill="#78350f" />
        <path d="M -5,4 Q 0,9 5,4" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
      </g>
    `;
  } else if (
    stickerLower.includes("flower") ||
    stickerLower.includes("floral") ||
    stickerLower.includes("rose") ||
    stickerLower.includes("blossom")
  ) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <circle cx="-6" cy="-6" r="16" fill="#fda4af" opacity="0.9" />
        <circle cx="8" cy="8" r="14" fill="#fecdd3" opacity="0.9" />
        <circle cx="10" cy="-10" r="15" fill="#f472b6" opacity="0.8" />
        <circle cx="-10" cy="10" r="12" fill="#fb7185" opacity="0.8" />
        <circle cx="0" cy="0" r="8" fill="#be123c" />
      </g>
    `;
  } else if (stickerLower.includes("heart") || stickerLower.includes("love")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <path d="M 5,-10 C 15,-25 35,-15 25,5 C 15,20 0,32 -5,32 C -15,25 -30,5 -20,-10 C -10,-25 0,-15 5,-10 Z" fill="#f43f5e" />
      </g>
    `;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgGradient.start}" />
          <stop offset="100%" stop-color="${bgGradient.end}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#cardGrad)" rx="24" />
      <rect x="25" y="25" width="550" height="550" fill="none" stroke="${bgGradient.border}" stroke-width="2.5" stroke-dasharray="8 6" rx="18" opacity="0.6" />
      <g transform="translate(300, 52)">
        <text text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="${bgGradient.leafColor}" font-weight="bold" letter-spacing="1.5" opacity="0.8">
          ESPECIALLY MADE FOR ${safeRecipient}
        </text>
      </g>
      ${stickerElement}
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svgContent.trim()).toString("base64")}`;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const body = rawBody as Record<string, unknown>;

    const recipient = sanitizeString(body.recipient, 100);
    const style = sanitizeString(body.style, 200);
    const sticker = sanitizeString(body.sticker, 200);

    const prompt = `A sweet and heartwarming watercolor-style digital art illustration of a cozy thank you card background for ${recipient || "someone special"}. Specific elements to include: ${sticker.toLowerCase() || "beautiful floral decor"}. Color scheme: ${style.toLowerCase() || "warm gentle pastel colors"}. It must feature a soft cream-colored empty parchment or clean blank paper space in the absolute center, perfectly prepared to display a thank you letter. The overall style must be unified, gentle, cozy, adorable, and comforting. STRICTLY NO TEXT, NO ALPHABETS, NO WORDS, and NO writing in the illustration.`;

    const agnesApiKey = process.env.AGNES_API_KEY?.trim() || "";
    const agnesBaseUrl = (
      process.env.AGNES_API_BASE_URL?.trim() || "https://apihub.agnes-ai.com/v1"
    ).replace(/\/+$/, "");
    const agnesImageModel = process.env.AGNES_IMAGE_MODEL?.trim() || "agnes-image-2.1-flash";
    let fallbackReason = agnesApiKey ? "" : "missing_agnes_key";

    // 1. Primary: Third-party Agnes image API
    if (agnesApiKey) {
      try {
        const response = await fetch(`${agnesBaseUrl}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${agnesApiKey}`,
          },
          signal: AbortSignal.timeout(50000),
          body: JSON.stringify({
            model: agnesImageModel,
            prompt,
            n: 1,
            size: "1024x1024",
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const first = data?.data?.[0];
          if (first?.b64_json && typeof first.b64_json === "string" && first.b64_json.length > 10) {
            return res.status(200).json({
              imageUrl: `data:image/png;base64,${first.b64_json}`,
              source: "agnes",
            });
          }
          if (first?.url && typeof first.url === "string" && isSafeRemoteImageUrl(first.url)) {
            try {
              const imgResponse = await fetch(first.url, {
                signal: AbortSignal.timeout(15000),
              });
              if (imgResponse.ok) {
                const arrayBuffer = await imgResponse.arrayBuffer();
                const base64String = Buffer.from(arrayBuffer).toString("base64");
                return res.status(200).json({
                  imageUrl: `data:image/png;base64,${base64String}`,
                  source: "agnes",
                });
              }
            } catch {
              // Return verified HTTPS URL directly if backend download times out
            }
            return res.status(200).json({
              imageUrl: first.url,
              source: "agnes",
            });
          }
          fallbackReason = "agnes_empty_image";
        } else {
          fallbackReason = `agnes_http_${response.status}`;
        }
      } catch {
        fallbackReason = "agnes_request_error";
      }
    }

    // 2. Fallback: Gemini image model (dynamically imported only when needed)
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: { "User-Agent": "aistudio-build" },
          },
        });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K",
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return res.status(200).json({
              imageUrl: `data:image/png;base64,${part.inlineData.data}`,
              source: "gemini",
            });
          }
        }
      } catch {
        // Fall through to SVG fallback
      }
    }

    return res.status(200).json({
      imageUrl: generateCustomSvg(style, sticker, recipient),
      source: "fallback",
      fallbackReason,
    });
  } catch (error) {
    console.error("Error in /api/card/generate:", error);
    return res.status(500).json({ error: "Failed to generate card background" });
  }
}
