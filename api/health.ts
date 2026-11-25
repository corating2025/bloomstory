interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default function handler(_req: ApiRequest, res: ApiResponse) {
  return res.status(200).json({
    status: "ok",
    hasAgnesKey: Boolean(process.env.AGNES_API_KEY?.trim()),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
  });
}
