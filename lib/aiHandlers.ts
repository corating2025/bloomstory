import { GoogleGenAI, Type } from "@google/genai";

export type FeedbackLanguage = "english" | "cantonese" | "mandarin";

export interface EmpathyCheckInput {
  id?: unknown;
  complaint?: unknown;
  advice?: unknown;
  userInput?: unknown;
  language?: unknown;
}

export interface EmpathyCheckResult {
  isEmpathetic: boolean;
  feedback: string;
}

export interface CardGenerateInput {
  message?: unknown;
  customPrompt?: unknown;
  recipient?: unknown;
  style?: unknown;
  sticker?: unknown;
}

export interface CardGenerateResult {
  imageUrl: string;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

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

function getAgnesConfig() {
  const apiKey = process.env.AGNES_API_KEY?.trim() || "";
  const baseUrl = (process.env.AGNES_API_BASE_URL?.trim() || "https://apihub.agnes-ai.com/v1").replace(/\/+$/, "");
  const chatModel = process.env.AGNES_CHAT_MODEL?.trim() || "agnes-2.0-flash";
  const imageModel = process.env.AGNES_IMAGE_MODEL?.trim() || "agnes-image-2.1-flash";
  return { apiKey, baseUrl, chatModel, imageModel };
}

function getOfflineFeedback(
  scenarioId: string,
  text: string,
  targetLang: FeedbackLanguage
): EmpathyCheckResult {
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

export async function handleEmpathyCheck(body: EmpathyCheckInput): Promise<EmpathyCheckResult> {
  const id = sanitizeString(body?.id, 64);
  const complaint = sanitizeString(body?.complaint, 500);
  const advice = sanitizeString(body?.advice, 500);
  const userInput = sanitizeString(body?.userInput, 1000);
  const targetLang = sanitizeLanguage(body?.language);

  if (userInput.length < 4) {
    return {
      isEmpathetic: false,
      feedback:
        targetLang === "cantonese"
          ? "同學，請寫一個更有誠意、至少4個字嘅回應！💖"
          : targetLang === "mandarin"
          ? "同学，请写一个更有诚意、至少4个字的回应！💖"
          : "Please write a more thoughtful response of at least 4 letters! 💖",
    };
  }

  const agnes = getAgnesConfig();

  // 1. Primary: Third-party Agnes API
  if (agnes.apiKey) {
    try {
      const response = await fetch(`${agnes.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agnes.apiKey}`,
        },
        body: JSON.stringify({
          model: agnes.chatModel,
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
            if (typeof parsed.isEmpathetic === "boolean" && typeof parsed.feedback === "string") {
              return {
                isEmpathetic: parsed.isEmpathetic,
                feedback: parsed.feedback,
              };
            }
          }
        }
      } else {
        console.warn(`Agnes chat API returned status ${response.status}; falling back.`);
      }
    } catch (agnesError) {
      console.error("Agnes chat API failed, falling back:", agnesError);
    }
  }

  // 2. Fallback: Gemini API
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `
        You are a supportive, warm, and highly constructive primary school English and Empathy class teacher.
        Evaluate the student's rewritten parent sentence for empathy, warm encouragement, and writing correctness.

        Original parent complaint: "${complaint}"
        Teacher's advice on the scenario: "${advice}"
        Student's proposed rewritten response: "${userInput}"

        Instructions:
        1. Evaluate three aspects:
           - Content and Structure: Does it express warmth and offer to help together instead of criticizing?
           - Word Choices: Does it use positive words and avoid negative labels (like lazy, picky, weak, terrible, untidy)?
           - Grammatical Correctness: Are there any minor typos or errors? Gently point them out.
        2. Language Preference:
           ${
             targetLang === "cantonese"
               ? "IMPORTANT: Provide all your feedback in TRADITIONAL CANTONESE (粤语/繁体中文), specifically in the tone of a kind Hong Kong teacher."
               : targetLang === "mandarin"
               ? "IMPORTANT: Provide all your feedback in SIMPLIFIED MANDARIN (普通话/简体中文), specifically in the tone of a kind teacher."
               : "IMPORTANT: Provide all your feedback in WARM, SIMPLE ENGLISH suitable for children."
           }
        3. Respond STRICTLY in JSON format matching this schema:
           - "isEmpathetic": boolean
           - "feedback": string (maximum 3 sentences, separated into [Content & Word Choices] and [Grammar Check] translated into the target language)
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
        return {
          isEmpathetic: parsed.isEmpathetic,
          feedback: parsed.feedback,
        };
      }
    } catch (geminiError) {
      console.error("Gemini empathy check failed, using offline fallback:", geminiError);
    }
  }

  // 3. Final fallback: Offline rule-based evaluation
  return getOfflineFeedback(id, userInput, targetLang);
}

export function generateCustomSvg(
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

  const splatters = `
    <g opacity="0.35">
      <path d="M 60,110 C 160,60 260,160 210,260 C 130,330 90,210 60,110 Z" fill="${bgGradient.start}" filter="blur(30px)" />
      <path d="M 490,90 C 540,190 390,230 370,330 C 340,410 470,490 490,90 Z" fill="${bgGradient.end}" filter="blur(35px)" />
      <path d="M 130,470 C 230,510 190,410 310,490 C 210,570 90,540 130,470 Z" fill="${bgGradient.accent}" filter="blur(40px)" />
    </g>
  `;

  let floralDecorations = "";
  if (styleLower.includes("sunset") || styleLower.includes("sky")) {
    floralDecorations = `
      <g transform="translate(60, 60)">
        <path d="M 0,-15 L 4,-4 L 15,0 L 4,4 L 0,15 L -4,4 L -15,0 L -4,-4 Z" fill="#fef08a" opacity="0.9" />
        <path d="M 20,-20 L 22,-5 L 37,-3 L 22,-1 L 20,14 L 18,-1 L 3,-3 L 18,-5 Z" fill="#fef08a" opacity="0.6" transform="scale(0.6)" />
      </g>
      <g transform="translate(520, 60)" opacity="0.85">
        <path d="M0,10 C-15,10 -25,0 -20,-15 C-15,-30 5,-30 15,-20 C25,-30 45,-25 45,-10 C55,-10 60,5 45,15 C35,25 15,20 0,10 Z" fill="#ffffff" />
      </g>
      <g transform="translate(70, 520)" opacity="0.8">
        <path d="M0,0 A 20,20 0 1,0 30,-10 A 15,15 0 1,1 0,0" fill="#fef08a" />
      </g>
    `;
  } else {
    floralDecorations = `
      <g transform="translate(60, 60)">
        <path d="M-40,0 C-20,-30 10,-30 20,0 C30,30 0,40 -40,0 Z" fill="${bgGradient.leafColor}" opacity="0.25" transform="rotate(-15)"/>
        <path d="M0,-40 C30,-20 30,10 0,20 C-30,30 -40,0 0,-40 Z" fill="${bgGradient.leafColor}" opacity="0.2" transform="rotate(45)"/>
        <circle cx="0" cy="0" r="16" fill="${bgGradient.border}" opacity="0.8" />
        <circle cx="6" cy="-6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
        <circle cx="-6" cy="6" r="12" fill="${bgGradient.accent}" opacity="0.7" />
        <circle cx="0" cy="0" r="6" fill="#ffffff" opacity="0.9" />
      </g>
      <g transform="translate(540, 60)">
        <path d="M0,0 Q-40,-20 -80,10" fill="none" stroke="${bgGradient.leafColor}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
        <circle cx="-40" cy="-10" r="8" fill="${bgGradient.border}" opacity="0.7"/>
        <circle cx="-70" cy="5" r="5" fill="${bgGradient.accent}" opacity="0.8"/>
      </g>
      <g transform="translate(60, 540)">
        <circle cx="0" cy="0" r="15" fill="${bgGradient.border}" opacity="0.7"/>
        <circle cx="-10" cy="-10" r="12" fill="${bgGradient.accent}" opacity="0.6"/>
        <circle cx="10" cy="10" r="10" fill="${bgGradient.leafColor}" opacity="0.4"/>
      </g>
    `;
  }

  let stickerElement = "";
  if (stickerLower.includes("cat") || stickerLower.includes("kitty")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <path d="M -50,5 C -55,-25 -45,-45 -25,-45 C -15,-45 -10,-35 0,-35 C 10,-35 15,-45 25,-45 C 45,-45 55,-25 50,5 C 45,35 25,45 0,45 C -25,45 -45,35 -50,5 Z" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
        <ellipse cx="0" cy="8" rx="32" ry="22" fill="#fbcfe8" />
        <circle cx="0" cy="-12" r="22" fill="#fbcfe8" />
        <polygon points="-18,-24 -8,-10 -22,-6" fill="#f9a8d4" />
        <polygon points="18,-24 8,-10 22,-6" fill="#f9a8d4" />
        <path d="M -12,-12 Q -8,-15 -4,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 4,-12 Q 8,-15 12,-12" fill="none" stroke="#6b21a8" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="-13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
        <circle cx="13" cy="-6" r="4" fill="#f43f5e" opacity="0.6" />
      </g>
    `;
  } else if (stickerLower.includes("sun") || stickerLower.includes("sunshine")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <circle cx="0" cy="0" r="48" fill="#ffffff" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.15))" />
        <circle cx="0" cy="0" r="28" fill="#fbbf24" />
        <circle cx="0" cy="0" r="25" fill="#fef08a" />
        <circle cx="-8" cy="-4" r="3" fill="#78350f" />
        <circle cx="8" cy="-4" r="3" fill="#78350f" />
        <path d="M -5,4 Q 0,9 5,4" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />
      </g>
    `;
  } else if (stickerLower.includes("bear")) {
    stickerElement = `
      <g transform="translate(460, 460)">
        <circle cx="0" cy="2" r="28" fill="#b45309" />
        <circle cx="0" cy="2" r="25" fill="#d97706" />
        <circle cx="-20" cy="-18" r="10" fill="#b45309" />
        <circle cx="20" cy="-18" r="10" fill="#b45309" />
        <ellipse cx="0" cy="8" rx="10" ry="7" fill="#fef3c7" />
        <polygon points="-3,5 3,5 0,8" fill="#78350f" />
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
  } else {
    stickerElement = `
      <g transform="translate(460, 460)">
        <path d="M 0,-34 L 10,-10 L 34,-7 L 15,10 L 21,34 L 0,19 L -21,34 L -15,10 L -34,-7 L -10,-10 Z" fill="#f59e0b" />
        <circle cx="0" cy="0" r="4" fill="#ffffff" opacity="0.9" />
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
      ${splatters}
      ${floralDecorations}
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

export async function handleCardGenerate(body: CardGenerateInput): Promise<CardGenerateResult> {
  const recipient = sanitizeString(body?.recipient, 100);
  const style = sanitizeString(body?.style, 200);
  const sticker = sanitizeString(body?.sticker, 200);

  const prompt = `A sweet and heartwarming watercolor-style digital art illustration of a cozy thank you card background for ${recipient || "someone special"}. Specific elements to include: ${sticker.toLowerCase() || "beautiful floral decor"}. Color scheme: ${style.toLowerCase() || "warm gentle pastel colors"}. It must feature a soft cream-colored empty parchment or clean blank paper space in the absolute center, perfectly prepared to display a thank you letter. The overall style must be unified, gentle, cozy, adorable, and comforting. STRICTLY NO TEXT, NO ALPHABETS, NO WORDS, and NO writing in the illustration.`;

  const agnes = getAgnesConfig();

  // 1. Primary: Third-party Agnes image API
  if (agnes.apiKey) {
    try {
      const response = await fetch(`${agnes.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agnes.apiKey}`,
        },
        body: JSON.stringify({
          model: agnes.imageModel,
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (response.ok) {
        const data: any = await response.json();
        const first = data?.data?.[0];
        if (first?.b64_json && typeof first.b64_json === "string" && first.b64_json.length > 10) {
          return { imageUrl: `data:image/png;base64,${first.b64_json}` };
        }
        if (first?.url && typeof first.url === "string" && isSafeRemoteImageUrl(first.url)) {
          try {
            const imgResponse = await fetch(first.url);
            if (imgResponse.ok) {
              const arrayBuffer = await imgResponse.arrayBuffer();
              const base64String = Buffer.from(arrayBuffer).toString("base64");
              return { imageUrl: `data:image/png;base64,${base64String}` };
            }
          } catch (fetchErr) {
            console.error("Failed downloading generated Agnes image:", fetchErr);
          }
          return { imageUrl: first.url };
        }
      } else {
        console.warn(`Agnes image API returned status ${response.status}; falling back.`);
      }
    } catch (agnesError) {
      console.error("Agnes image API failed, falling back:", agnesError);
    }
  }

  // 2. Fallback: Gemini image model
  const ai = getGeminiClient();
  if (ai) {
    try {
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
          return { imageUrl: `data:image/png;base64,${part.inlineData.data}` };
        }
      }
    } catch (geminiError) {
      console.error("Gemini image generation failed, falling back to custom SVG:", geminiError);
    }
  }

  // 3. Final fallback: Custom watercolor SVG
  return { imageUrl: generateCustomSvg(style, sticker, recipient) };
}
