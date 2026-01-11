import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import pRetry from "p-retry";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export interface SimplifiedBallotMeasure {
  oneSentence: string;
  simple: string;
  detailed: string;
  fiscalImpact?: string;
  keyPoints: string[];
}

export async function simplifyBallotMeasure(
  originalText: string,
  title: string
): Promise<SimplifiedBallotMeasure> {
  const limit = pLimit(1);

  return limit(() =>
    pRetry(
      async () => {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          system: `You are an expert at explaining complex legal and political language to young voters. Your goal is to help people understand ballot measures without any political bias. Always present information factually and neutrally.`,
          messages: [
            {
              role: "user",
              content: `Please analyze this ballot measure and provide simplified explanations:

Title: ${title}

Original Text:
"${originalText}"

Provide your response in the following JSON format:
{
  "oneSentence": "A single sentence summary (max 15 words)",
  "simple": "A simple explanation (50-75 words, 8th grade reading level)",
  "detailed": "A detailed breakdown (150-200 words)",
  "fiscalImpact": "The fiscal impact explained simply (if applicable, otherwise null)",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}

Important guidelines:
- Use plain language, avoid jargon
- Be neutral and factual
- Focus on what changes and who is affected
- Make it relevant to young adults
- Return ONLY valid JSON, no other text`,
            },
          ],
        });

        const content = message.content[0];
        if (content.type !== "text") {
          throw new Error("Unexpected response type");
        }

        try {
          const parsed = JSON.parse(content.text);
          return {
            oneSentence: parsed.oneSentence || "",
            simple: parsed.simple || "",
            detailed: parsed.detailed || "",
            fiscalImpact: parsed.fiscalImpact || undefined,
            keyPoints: parsed.keyPoints || [],
          };
        } catch (e) {
          const jsonMatch = content.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              oneSentence: parsed.oneSentence || "",
              simple: parsed.simple || "",
              detailed: parsed.detailed || "",
              fiscalImpact: parsed.fiscalImpact || undefined,
              keyPoints: parsed.keyPoints || [],
            };
          }
          throw new Error("Failed to parse AI response as JSON");
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
        onFailedAttempt: (error) => {
          if (!isRateLimitError(error)) {
            throw new pRetry.AbortError(error);
          }
        },
      }
    )
  );
}

export interface BiasCheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
  isBalanced: boolean;
}

export async function checkBias(
  content: string,
  contentType: "summary" | "argument"
): Promise<BiasCheckResult> {
  const limit = pLimit(1);

  return limit(() =>
    pRetry(
      async () => {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: `You are an expert at detecting political bias in text. Your job is to identify loaded language, missing context, and one-sided arguments.`,
          messages: [
            {
              role: "user",
              content: `Analyze this ${contentType} for potential bias:

"${content}"

Provide your response in the following JSON format:
{
  "score": <number from 0-100, where 0 is completely neutral and 100 is extremely biased>,
  "issues": ["List of specific bias issues found"],
  "suggestions": ["List of suggestions to make it more balanced"],
  "isBalanced": <true/false>
}

Return ONLY valid JSON, no other text.`,
            },
          ],
        });

        const responseContent = message.content[0];
        if (responseContent.type !== "text") {
          throw new Error("Unexpected response type");
        }

        try {
          const parsed = JSON.parse(responseContent.text);
          return {
            score: parsed.score || 0,
            issues: parsed.issues || [],
            suggestions: parsed.suggestions || [],
            isBalanced: parsed.isBalanced ?? true,
          };
        } catch (e) {
          const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              score: parsed.score || 0,
              issues: parsed.issues || [],
              suggestions: parsed.suggestions || [],
              isBalanced: parsed.isBalanced ?? true,
            };
          }
          throw new Error("Failed to parse AI response as JSON");
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
        onFailedAttempt: (error) => {
          if (!isRateLimitError(error)) {
            throw new pRetry.AbortError(error);
          }
        },
      }
    )
  );
}
