interface ApiRequest {
  method?: string;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

type FeedbackLanguage = "english" | "cantonese" | "mandarin";

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeLanguage(value: unknown): FeedbackLanguage {
  if (value === "cantonese" || value === "mandarin" || value === "english") {
    return value;
  }
  return "english";
}

function getOfflineFeedback(
  scenarioId: string,
  text: string,
  targetLang: FeedbackLanguage
) {
  const lowerInput = text.toLowerCase();
  const generalHarshWords = [
    "lazy",
    "picky",
    "weak",
    "terrible",
    "disgusting",
    "untidy",
    "stupid",
    "dumb",
    "clumsy",
    "careless",
    "bad",
  ];
  const scenarioHarshWords: Record<string, string[]> = {
    homework: ["lazy", "slacker", "slow", "stupid", "dumb"],
    sports: ["weak", "slow", "loser", "useless", "terrible"],
    dinner: ["picky", "spoiled", "stubborn", "disgusting"],
    cleaning: ["terrible", "messy", "pig", "untidy", "dirty", "disgusting"],
    piano: ["terrible", "awful", "bad", "stupid"],
    bedtime: ["weak", "lazy", "picky", "terrible", "untidy"],
  };

  const currentHarshWords = scenarioHarshWords[scenarioId] || generalHarshWords;
  const foundHarsh =
    currentHarshWords.find((w) => lowerInput.includes(w)) ||
    generalHarshWords.find((w) => lowerInput.includes(w));

  const grammarPoints: string[] = [];
  if (text.length > 0 && text[0] !== text[0].toUpperCase()) {
    grammarPoints.push("Capitalize the first letter of your sentence");
  }
  if (!/[.!?。！？]$/.test(text.trim())) {
    grammarPoints.push("End your sentence with punctuation like a period or exclamation mark");
  }
  if (/\s{2,}/.test(text)) {
    grammarPoints.push("Avoid double spaces between words");
  }

  if (foundHarsh) {
    let grammarFeedback =
      targetLang === "cantonese"
        ? "你嘅語法睇落冇問題，但係我哋先改下啲措辭啦！🌸"
        : targetLang === "mandarin"
        ? "你的语法看起来没问题，但是我们先改一下措辞吧！🌸"
        : "Your grammar looks fine, but let's fix the wording first! 🌸";
    if (grammarPoints.length > 0) {
      grammarFeedback =
        targetLang === "cantonese"
          ? `同埋，有個寫作小貼士：試下 ${grammarPoints[0].toLowerCase()}。`
          : targetLang === "mandarin"
          ? `而且，有个写作小贴士：试着 ${grammarPoints[0].toLowerCase()}。`
          : `Also, a quick writing tip: try to ${grammarPoints[0].toLowerCase()}.`;
    }
    return {
      isEmpathetic: false,
      feedback:
        targetLang === "cantonese"
          ? `[內容與用詞]：盡量避免好似「${foundHarsh}」呢類負面標籤。試下表達理解先啦！🌸\n\n[語法檢查]：${grammarFeedback}`
          : targetLang === "mandarin"
          ? `[内容与用词]：尽量避免像“${foundHarsh}”这类负面标签。试着表达理解吧！🌸\n\n[语法检查]：${grammarFeedback}`
          : `[Content & Word Choices]: Try to avoid negative labels like "${foundHarsh}". Express understanding instead! 🌸\n\n[Grammar Check]: ${grammarFeedback}`,
    };
  }

  if (text.trim().length < 8) {
    return {
      isEmpathetic: false,
      feedback:
        targetLang === "cantonese"
          ? "[內容與用詞]：呢個係一個好嘅開始，但係我哋試下寫長啲、溫暖啲嘅句子，等 Yuen 真正感受到我哋理解佢嘅感受！❤️\n\n[語法檢查]：繼續努力！"
          : targetLang === "mandarin"
          ? "[内容与用词]：这是一个好的开始，但是我们试着写长一点、温暖一点的句子，让 Yuen 真正感受到我们理解他的感受！❤️\n\n[语法检查]：继续努力！"
          : "[Content & Word Choices]: This is a good start, but let's write a slightly longer, warmer sentence to show Yuen we truly understand his feelings! ❤️\n\n[Grammar Check]: Keep it up!",
    };
  }

  const successFeedbacks: Record<string, string> =
    targetLang === "cantonese"
      ? {
          homework: "做得好出色呀！透過主動幫手做數學或者建議休息下，Yuen 會感受到支持而唔係被標籤為懶！💖",
          sports: "好棒呀！提醒 Yuen 努力先係最重要，仲有提議一齊練習，會令佢覺得自己好強壯同被愛！🏃‍♂️",
          dinner: "改得好靚！問下佢係咪唔舒服，或者提議試一小口，表現出你對佢感受嘅深度理解！🍲",
          piano: "做得太好喇！溫柔地鼓勵佢慢慢練，可以幫佢建立信心，重新愛上彈琴！🎹",
          cleaning: "太好喇！提議一齊執房或者問佢係咪攰，將家務變成一個合作、親切嘅時刻！🧹",
          bedtime: "好溫暖嘅安慰！你令 Yuen 知道自己嘅努力被睇見，感受到滿滿嘅愛同安全感！🌙",
        }
      : targetLang === "mandarin"
      ? {
          homework: "做得真出色！通过主动帮忙做数学或者建议休息一下，Yuen 会感受到支持而不是被贴上懒惰的标签！💖",
          sports: "太棒了！提醒 Yuen 努力才是最重要的，并提议一起练习，会让他觉得强壮且被爱！🏃‍♂️",
          dinner: "改得真好！问下他是不是不舒服，或者提议尝一小口，表现出你对他感受的深度理解！🍲",
          piano: "做得太好了！温柔地鼓励他慢慢练习，可以帮助他建立信心！🎹",
          cleaning: "太好了！提议一起打扫房间或者问他是不是累了，把家务变成一个合作且亲切的时刻！🧹",
          bedtime: "好温暖的安慰！你让 Yuen 知道自己的努力被看见，感受到满满的爱与安全感！🌙",
        }
      : {
          homework: "What a wonderful response! By offering to help with math or suggesting a break, Yuen feels supported instead of lazy! 💖",
          sports: "Excellent! Reminding Yuen that effort is what matters and offering to practice together makes him feel strong and loved! 🏃‍♂️",
          dinner: "Beautifully rewritten! Asking if he doesn't feel well or offering to try a small bite shows deep understanding of his feelings! 🍲",
          piano: "Amazing job! Encouraging him gently and practicing together builds his confidence and joy in learning! 🎹",
          cleaning: "Fantastic! Offering to clean up together or asking if he's tired turns a chore into a collaborative, kind moment! 🧹",
          bedtime: "What a healing message! You reminded Yuen that his effort matters and that he is truly loved! 🌙",
        };

  const defaultFeedback =
    targetLang === "cantonese"
      ? "你嘅回應睇落好正呀！好出色嘅溫暖、支持同有同理心嘅詞語選擇。Yuen 覺得舒服好多喇！💖"
      : targetLang === "mandarin"
      ? "你的回应看起来真棒！非常出色且充满温情、支持和同理心的词语选择。Yuen 觉得舒服多了！💖"
      : "Your response looks wonderful! Excellent choice of warm, supportive, and empathetic words. Yuen feels so much better! 💖";

  let grammarText =
    targetLang === "cantonese"
      ? "你嘅拼寫同語法都好完美！寫得好出色！📝"
      : targetLang === "mandarin"
      ? "你的拼写和语法都很完美！写得非常出色！📝"
      : "Your spelling and grammar are perfect! Excellent writing! 📝";
  if (grammarPoints.length > 0) {
    grammarText =
      targetLang === "cantonese"
        ? `你嘅信息好靚好關心！只係有一個細微嘅寫作貼士：試下 ${grammarPoints.join(" 同埋 ").toLowerCase()}，令到件作品更加完美。📝`
        : targetLang === "mandarin"
        ? `你的信息很美且充满关怀！只是有一个细微的写作贴士：试着 ${grammarPoints.join(" 以及 ").toLowerCase()}，让作品更完美。📝`
        : `Your message is beautiful and caring! Just a tiny writing tip: try to ${grammarPoints.join(" and ").toLowerCase()} to make it even more pristine. 📝`;
  }

  return {
    isEmpathetic: true,
    feedback:
      targetLang === "cantonese"
        ? `[內容與用詞]：${successFeedbacks[scenarioId] || defaultFeedback}\n\n[語法檢查]：${grammarText}`
        : targetLang === "mandarin"
        ? `[内容与用词]：${successFeedbacks[scenarioId] || defaultFeedback}\n\n[语法检查]：${grammarText}`
        : `[Content & Word Choices]: ${successFeedbacks[scenarioId] || defaultFeedback}\n\n[Grammar Check]: ${grammarText}`,
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const rawBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const body = rawBody as Record<string, unknown>;

    const id = sanitizeString(body.id, 64);
    const complaint = sanitizeString(body.complaint, 500);
    const advice = sanitizeString(body.advice, 500);
    const userInput = sanitizeString(body.userInput, 1000);
    const targetLang = sanitizeLanguage(body.language);

    if (userInput.length < 4) {
      return res.status(200).json({
        isEmpathetic: false,
        source: "validation",
        feedback:
          targetLang === "cantonese"
            ? "同學，請寫一個更有誠意、至少4個字嘅回應！💖"
            : targetLang === "mandarin"
            ? "同学，请写一个更有诚意、至少4个字的回应！💖"
            : "Please write a more thoughtful response of at least 4 letters! 💖",
      });
    }

    const agnesApiKey = process.env.AGNES_API_KEY?.trim() || "";
    const agnesBaseUrl = (
      process.env.AGNES_API_BASE_URL?.trim() || "https://apihub.agnes-ai.com/v1"
    ).replace(/\/+$/, "");
    const agnesChatModel = process.env.AGNES_CHAT_MODEL?.trim() || "agnes-2.0-flash";
    let fallbackReason = agnesApiKey ? "" : "missing_agnes_key";

    // 1. Primary: Third-party Agnes API
    if (agnesApiKey) {
      try {
        const response = await fetch(`${agnesBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${agnesApiKey}`,
          },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            model: agnesChatModel,
            messages: [
              {
                role: "system",
                content: `You are a supportive, warm, and highly constructive primary school English and Empathy class teacher.
Evaluate the student's rewritten parent sentence for empathy, word choice, and grammatical correctness.

Your feedback must evaluate three aspects:
1. Content and Structure: Praise if they offered warm support, constructive advice, or a collaborative solution. Gentle guidance if not.
2. Word Choices: Praise positive, warm, and gentle words. Gently warn against negative labels (e.g. lazy, weak, picky, terrible, untidy, disgusting).
3. Grammatical Correctness: Praise if there are no errors, or gently and sweetly point out spelling/grammar/punctuation mistakes.

IMPORTANT:
- Use "同学" (Student) to address the user.
- NEVER use intimate terms like "宝贝" (Baby), "亲爱的" (Dear), or "心肝".
- Respond STRICTLY in the target language requested below.
Current Target Language: ${
                  targetLang === "cantonese"
                    ? "TRADITIONAL CANTONESE (粤语/繁体中文) - Tone: Kind Hong Kong teacher"
                    : targetLang === "mandarin"
                    ? "SIMPLIFIED MANDARIN (普通话/简体中文) - Tone: Kind Southern Chinese teacher (gentle and soft)"
                    : "WARM, SIMPLE ENGLISH - Tone: Kind English teacher"
                }

Respond STRICTLY in JSON format matching this schema:
{
  "isEmpathetic": boolean (true if the response is caring and supportive; false if it contains negative labels or harsh criticisms),
  "feedback": "string (a super warm feedback, maximum 3 sentences. Separate your feedback into clear sections for [Content & Word Choices] and [Grammar Check]. Speak directly to the student! PROVIDE THIS ENTIRE STRING IN THE TARGET LANGUAGE ABOVE.)"
}
Note: If the target language is Cantonese or Mandarin, translate the headers like [Content & Word Choices] and [Grammar Check] to [内容与用词] and [语法检查] (or [內容與用詞] and [語法檢查] for Traditional).`,
              },
              {
                role: "user",
                content: `Original parent complaint: "${complaint}"
Teacher's advice on the scenario: "${advice}"
Student's proposed rewritten response: "${userInput}"`,
              },
            ],
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const content = data?.choices?.[0]?.message?.content?.trim();
          if (typeof content === "string") {
            const jsonStart = content.indexOf("{");
            const jsonEnd = content.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1) {
              const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
              if (
                typeof parsed.isEmpathetic === "boolean" &&
                typeof parsed.feedback === "string"
              ) {
                return res.status(200).json({
                  isEmpathetic: parsed.isEmpathetic,
                  feedback: parsed.feedback,
                  source: "agnes",
                });
              }
            }
          }
          fallbackReason = "agnes_invalid_json";
        } else {
          fallbackReason = `agnes_http_${response.status}`;
        }
      } catch {
        fallbackReason = "agnes_request_error";
      }
    }

    // 2. Fallback: Gemini API (dynamically imported only when needed)
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiKey) {
      try {
        const { GoogleGenAI, Type } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: { "User-Agent": "aistudio-build" },
          },
        });
        const prompt = `
          You are a supportive, warm, and highly constructive primary school English and Empathy class teacher.
          Evaluate the student's rewritten parent sentence for empathy, warm encouragement, and writing correctness.

          Original parent complaint: "${complaint}"
          Teacher's advice on the scenario: "${advice}"
          Student's proposed rewritten response: "${userInput}"

          Language Preference:
          ${
            targetLang === "cantonese"
              ? "IMPORTANT: Provide all your feedback in TRADITIONAL CANTONESE (粤语/繁体中文)."
              : targetLang === "mandarin"
              ? "IMPORTANT: Provide all your feedback in SIMPLIFIED MANDARIN (普通话/简体中文)."
              : "IMPORTANT: Provide all your feedback in WARM, SIMPLE ENGLISH suitable for children."
          }

          Respond STRICTLY in JSON format with "isEmpathetic" (boolean) and "feedback" (string, max 3 sentences with [Content & Word Choices] and [Grammar Check] headers translated into the target language).
        `;
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isEmpathetic: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING },
              },
              required: ["isEmpathetic", "feedback"],
            },
          },
        });
        const parsed = JSON.parse((response.text || "{}").trim());
        if (typeof parsed.isEmpathetic === "boolean" && typeof parsed.feedback === "string") {
          return res.status(200).json({
            isEmpathetic: parsed.isEmpathetic,
            feedback: parsed.feedback,
            source: "gemini",
          });
        }
      } catch {
        // Fall through to offline fallback
      }
    }

    return res.status(200).json({
      ...getOfflineFeedback(id, userInput, targetLang),
      source: "fallback",
      fallbackReason,
    });
  } catch (error) {
    console.error("Error in /api/empathy/check:", error);
    return res.status(500).json({ error: "Failed to evaluate empathy response" });
  }
}
