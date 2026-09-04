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
  instructions: `Detect the primary language of the user's input.
Return the BCP-47 language code (e.g. 'en', 'ta', 'hi', 'ml', 'te', 'kn', 'mr', 'bn', 'or', 'gu').
Be specific: Tamil is 'ta', Hindi is 'hi', Malayalam is 'ml', Telugu is 'te', Kannada is 'kn'.
If the text uses multiple languages (code-switching), return the dominant one.
If uncertain, return 'en'.`,
  outputType: LanguageDetectionSchema,
});

let _lastDetectedLanguage = "en";

export function getLastDetectedLanguage(): string {
  return _lastDetectedLanguage;
}

export const languageDetectionGuardrail: InputGuardrail = {
  name: "LanguageDetectionGuardrail",
  async execute({ input }) {
    const queryText =
      typeof input === "string"
        ? input
        : Array.isArray(input)
          ? input
              .map((m) => {
                if (typeof m === "string") return m;
                if (typeof m === "object" && m !== null && "content" in m) {
                  const c = (m as any).content;
                  if (Array.isArray(c)) {
                    return c.map((part: any) => part.text || "").join(" ");
                  }
                  return String(c);
                }
                return "";
              })
              .join("\n")
          : String(input);

    let result: z.infer<typeof LanguageDetectionSchema>;
    try {
      const runResult = await run(languageDetectorAgent, queryText);
      result = runResult.finalOutput as z.infer<typeof LanguageDetectionSchema>;
      _lastDetectedLanguage = result.languageCode;
      console.log(
        `[LanguageDetectionGuardrail] Detected language: ${result.languageCode} (${result.languageName}), confidence: ${result.confidence}`,
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
      tripwireTriggered: false, // Never blocks
    };
  },
};
