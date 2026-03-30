import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { ALL_DISEASES } from "@/lib/diseases-list";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    const prompt = `
      Act as a medical assistant. Analyze: ${symptoms.join(", ")}.
      Return a JSON object with a key "predictions" containing the top 3 likely conditions.
      
      ALLOWED DISEASES: ${ALL_DISEASES.join(", ")}
      
      Sample Format:
      {
        "predictions": [
          { "disease": "Name", "confidence": 95.0 },
          { "disease": "Name", "confidence": 70.0 }
        ]
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Recommended model for accuracy
      response_format: { type: "json_object" }, // Forces JSON output
      temperature: 0.2, // Keeps output deterministic
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    return NextResponse.json(JSON.parse(responseContent || "{}"));
    
  } catch (error) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}