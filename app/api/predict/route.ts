import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 2. Define the schema with an explicit 'Schema' type to resolve the error
const schema: Schema = {
  description: "Disease predictions based on symptoms",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      disease: { 
        type: SchemaType.STRING, 
        description: "Name of the disease" 
      },
      confidence: { 
        type: SchemaType.NUMBER, 
        description: "Confidence percentage (0-100)" 
      },
    },
    required: ["disease", "confidence"],
  },
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash"
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symptoms: string[] = body.symptoms;

    if (!symptoms || symptoms.length < 3) {
      return NextResponse.json(
        { error: "Select at least 3 symptoms" }, 
        { status: 400 }
      );
    }

const prompt = `
  Analyze these symptoms: ${symptoms.join(", ")}. 
  Return exactly the top 3 most likely conditions. 

  Example Output:
  [
    { "disease": "Condition Name", "confidence": 95.5 },
    { "disease": "Condition Name", "confidence": 70.2 },
    { "disease": "Condition Name", "confidence": 40.0 }
  ]

  Return ONLY the raw JSON array. No markdown, no text.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // 4. Return the data to your frontend
    return NextResponse.json({ predictions: JSON.parse(text) });
    
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Analysis failed" }, 
      { status: 500 }
    );
  }
}