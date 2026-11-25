import { handleEmpathyCheck } from "../../lib/aiHandlers.ts";

interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = await handleEmpathyCheck(body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in /api/empathy/check:", error);
    return res.status(500).json({ error: "Failed to evaluate empathy response" });
  }
}
