import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { ALL_SYMPTOMS } from "@/lib/symptoms-list"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 1. Remove the 'enum' to prevent the branching error
const relatedSchema: Schema = {
  description: "List of related symptoms",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.STRING,
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: relatedSchema,
  },
});

export async function POST(request: Request) {
  try {
    const { symptoms } = await request.json();

    // 2. Provide the symptoms in the prompt text instead of the schema
    const prompt = `
      A user has selected these symptoms: ${symptoms.join(", ")}. 
      Suggest 5 other symptoms frequently associated with these.
      
      CRITICAL: You must only suggest symptoms from this exact list:
      ${ALL_SYMPTOMS.join(", ")}
    `;

    const result = await model.generateContent(prompt);
    const rawRelated: string[] = JSON.parse(result.response.text());

    // 3. SANITIZATION: Filter the AI response to ensure only valid symptoms pass through
    const validatedRelated = rawRelated.filter(s => ALL_SYMPTOMS.includes(s));

    return NextResponse.json({ related: validatedRelated });
  } catch (error) {
    console.error("Related Symptoms Error:", error);
    return NextResponse.json({ related: [] });
  }
}