import { createServerFn } from "@tanstack/react-start";

type ValidationResult = {
  isProfile: boolean;
  reason: string;
  missing?: string[];
};

export const validateProfileImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as { imageDataUrl?: unknown }).imageDataUrl !== "string"
    ) {
      throw new Error("imageDataUrl is required");
    }
    return { imageDataUrl: (data as { imageDataUrl: string }).imageDataUrl };
  })
  .handler(async ({ data }): Promise<ValidationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { isProfile: false, reason: "AI service not configured." };
    }

    const prompt = `You are a strict validator for a dating-profile screenshot scanner.
Decide if the image is a screenshot of a dating app profile (e.g. Tinder, Bumble, Hinge, Match, OkCupid).

Check for these required dating-app screenshot signals:
1. "Phone status bar" — time, battery, signal at top
2. "Profile photo area" — large portrait photo of a person
3. "Name and age" — name with age (e.g. "Sarah, 27")
4. "Profile metadata" — distance, location, or bio text
5. "Dating app UI controls" — swipe buttons, like/dislike, message icon, or verification badge

REJECT if the image is a random photo, selfie, meme, screenshot of another app, document, drawing, blank image, NSFW, landscape, food, or anything not matching a dating app profile.

Respond ONLY with strict JSON in this exact shape:
{"isProfile": boolean, "reason": "short reason", "missing": ["list of required signals NOT present in the image, using the exact labels above"]}

If isProfile is true, "missing" must be an empty array. If false, "missing" must list every signal that is absent.`;

    try {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: { url: data.imageDataUrl },
                  },
                ],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        return {
          isProfile: false,
          reason: "Could not verify the image. Please try again.",
        };
      }

      const json = await response.json();
      const content: string =
        json?.choices?.[0]?.message?.content?.toString() ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return { isProfile: false, reason: "Invalid response from validator." };
      }
      const parsed = JSON.parse(match[0]) as ValidationResult;
      return {
        isProfile: Boolean(parsed.isProfile),
        reason:
          typeof parsed.reason === "string" && parsed.reason.length > 0
            ? parsed.reason
            : parsed.isProfile
              ? "Valid dating profile screenshot."
              : "This does not look like a dating profile screenshot.",
        missing: Array.isArray(parsed.missing)
          ? parsed.missing.filter((m): m is string => typeof m === "string")
          : [],
      };
    } catch {
      return {
        isProfile: false,
        reason: "Could not verify the image. Please try again.",
      };
    }
  });