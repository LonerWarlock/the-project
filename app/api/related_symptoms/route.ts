import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { ALL_SYMPTOMS } from "@/lib/symptoms-list";
import { ALL_SYMPTOMS_ANN } from "@/lib/symptoms-list-ann";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { symptoms, modelType } = await request.json();

    // Determine which list to use based on the modelType parameter
    const isAdvanced = modelType === "advanced";
    const targetList = isAdvanced ? ALL_SYMPTOMS_ANN : ALL_SYMPTOMS;

    const prompt = `
      Selected: ${symptoms.join(", ")}. 
      Suggest 5 related symptoms from this list ONLY: ${targetList.join(", ")}.
      Return as JSON: { "related": ["symptom1", "symptom2", "symptom3", "symptom4", "symptom5"] }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0].message.content || "{}"));
  } catch (error) {
    console.error("Related symptoms error:", error);
    return NextResponse.json({ related: [] });
  }
}