import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { ALL_DISEASES } from "@/lib/diseases-list"; // Import the list

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const schema: Schema = {
  description: "Disease predictions based on symptoms",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      disease: { 
        type: SchemaType.STRING, 
        description: "Name of the disease",
        enum: ALL_DISEASES // <--- Constraint added here
      } as any,
      confidence: { 
        type: SchemaType.NUMBER, 
        description: "Confidence percentage (0-100)" 
      },
    },
    required: ["disease", "confidence"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    const prompt = `
      Act as a medical assistant. Analyze: ${symptoms.join(", ")}. 
      Return the top 3 likely conditions from the allowed list.
      
      Example Output:
      [
        { "disease": "Diabetes", "confidence": 92.0 },
        { "disease": "Hypertension", "confidence": 15.5 }
      ]
    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ predictions: JSON.parse(result.response.text()) });
    
  } catch (error) {
    console.error("Prediction Error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}