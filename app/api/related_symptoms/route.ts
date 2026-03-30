import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash"
});

export async function POST(request: Request) {
  const { symptoms } = await request.json();

  const prompt = `A patient has: ${symptoms.join(", ")}. 
  Suggest 5 other related symptoms they might have. 
  Return only a JSON array of strings.`;

  const result = await model.generateContent(prompt);
  const related = JSON.parse(result.response.text());

  return NextResponse.json({ related });
}