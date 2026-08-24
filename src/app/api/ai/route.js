// src/app/api/ai/route.js
import { NextResponse } from "next/server";
import { aiService } from "@/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "match":
        if (!params.lead || !params.tutors) {
          return NextResponse.json({ error: "Lead and Tutors are required" }, { status: 400 });
        }
        result = await aiService.matchTutors(params.lead, params.tutors);
        break;

      case "template":
        if (!params.lead || !params.status) {
          return NextResponse.json({ error: "Lead and status are required" }, { status: 400 });
        }
        result = await aiService.generateCRMTemplate(params.lead, params.status, params.tutor);
        break;

      case "screen":
        if (!params.resumeText || !params.jobTitle) {
          return NextResponse.json({ error: "resumeText and jobTitle are required" }, { status: 400 });
        }
        result = await aiService.screenResume(params.resumeText, params.jobTitle);
        break;

      case "chat":
        if (!params.message) {
          return NextResponse.json({ error: "message is required" }, { status: 400 });
        }
        result = await aiService.chatAssistant(params.message, params.chatHistory || [], params.userRole || "parent");
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("API Route AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
