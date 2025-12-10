"use server";

import { headers } from "next/headers";
import type { Feedback } from "@/components/geistdocs/feedback";
import { emotions } from "./emotions";

const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const baseUrl = `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;

export const sendFeedback = async (
  url: string,
  feedback: Feedback
): Promise<{ success: boolean }> => {
  const emoji = emotions.find((e) => e.name === feedback.emotion)?.emoji;
  const endpoint = new URL("/feedback", "https://geistdocs.com/feedback");
  const headersList = await headers();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      note: feedback.message,
      url: new URL(url, baseUrl).toString(),
      emotion: emoji,
      ua: headersList.get("user-agent") ?? undefined,
      ip: headersList.get("x-real-ip") || headersList.get("x-forwarded-for"),
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    console.error(error);

    return { success: false };
  }

  return {
    success: true,
  };
};
