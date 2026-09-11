import { Agent, run, InputGuardrail } from "@openai/agents";
import { z } from "zod";

export const LanguageDetectionSchema = z.object({
  languageCode: z
    .string()
    .describe(
      "BCP-47 language code detected in the input (e.g. 'en', 'ta', 'hi')",
    ),
  languageName: z.string().describe("Human-readable language name"),
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Confidence level of the detection"),
});

const languageDetectorAgent = new Agent({
  name: "LanguageDetectorAgent",
  model: "gpt-4o-mini",
  instructions: `Detect the primary language of the user's query text.
Return the BCP-47 language code (e.g. 'en', 'ta', 'hi', 'ml', 'te', 'kn', 'mr', 'bn', 'or', 'gu').
Be specific: Tamil is 'ta', Hindi is 'hi', Malayalam is 'ml', Telugu is 'te', Kannada is 'kn'.
If the text uses multiple languages (code-switching), return the dominant one.
If uncertain, return 'en'.
IMPORTANT: Base your detection ONLY on the user's own words. Ignore any metadata tags, coordinates, or system annotations.`,
  outputType: LanguageDetectionSchema,
});

let _lastDetectedLanguage = "en";

export function getLastDetectedLanguage(): string {
  return _lastDetectedLanguage;
}

function stripSystemAnnotations(text: string): string {
  const withoutLocation = text.replace(
    /\[User's current location:[^\]]*\]/gi,
    "",
  );
  const withoutTags = withoutLocation.replace(/\[[\w\s]+:[^\]]{1,200}\]/g, "");
  return withoutTags.trim();
}

export const languageDetectionGuardrail: InputGuardrail = {
  name: "LanguageDetectionGuardrail",
  async execute({ input }) {
    // 1. Flatten input to a single string
    const rawText =
      typeof input === "string"
        ? input
        : Array.isArray(input)
          ? input
              .map((m) => {
                if (typeof m === "string") return m;
                if (typeof m === "object" && m !== null && "content" in m) {
                  const c = (m as { content: unknown }).content;
                  if (Array.isArray(c)) {
                    return c.map((part: { text?: string }) => part.text ?? "").join(" ");
                  }
                  return String(c);
                }
                return "";
              })
              .join("\n")
          : String(input);

    // 2. Strip system-injected annotations so we only detect the user's language
    const userText = stripSystemAnnotations(rawText);

    // 3. Fall back to English if nothing remains after stripping
    if (!userText) {
      _lastDetectedLanguage = "en";
      return {
        outputInfo: { languageCode: "en", languageName: "English", confidence: "low" },
        tripwireTriggered: false,
      };
    }

    // 4. Detect language from the clean user text only
    let result: z.infer<typeof LanguageDetectionSchema>;
    try {
      const runResult = await run(languageDetectorAgent, userText);
      result = runResult.finalOutput as z.infer<typeof LanguageDetectionSchema>;
      _lastDetectedLanguage = result.languageCode;
      console.log(
        `[LanguageDetectionGuardrail] Detected: ${result.languageCode} (${result.languageName}), confidence: ${result.confidence}`,
      );
    } catch {
      result = {
        languageCode: "en",
        languageName: "English",
        confidence: "low",
      };
    }

    return {
      outputInfo: result,
      tripwireTriggered: false, // Never blocks — purely informational
    };
  },
};

