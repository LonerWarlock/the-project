import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { ALL_SYMPTOMS } from "@/lib/symptoms-list";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    const prompt = `
      Selected: ${symptoms.join(", ")}. 
      Suggest 5 related symptoms from this list ONLY: ${ALL_SYMPTOMS.join(", ")}.
      Return as JSON: { "related": ["symptom1", "symptom2"] }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0].message.content || "{}"));
  } catch (error) {
    return NextResponse.json({ related: [] });
  }
}