import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { PREDICTION_MODE } from "@/lib/config";
import { ALL_DISEASES } from "@/lib/diseases-list";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    if (PREDICTION_MODE === 0) {
      // --- PATH 0: CUSTOM ML MODEL ---
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      if (!response.ok) throw new Error("Local ML Service Unreachable");

      const data = await response.json();
      // data.predictions is already the array of top 3
      return NextResponse.json({ predictions: data.predictions });
    } else {
      // --- PATH 1: GROQ BACKUP ---
      const prompt = `Analyze: ${symptoms.join(", ")}. Return top 3 likely conditions from: ${ALL_DISEASES.join(", ")}. Return ONLY JSON: { "predictions": [{ "disease": "Name", "confidence": 95 }] }`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      return NextResponse.json(
        JSON.parse(completion.choices[0].message.content || "{}"),
      );
    }
  } catch (error) {
    console.error("Prediction Error:", error);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
