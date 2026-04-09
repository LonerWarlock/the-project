import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { messages, validateOnly, category } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "Required" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content;

    // 1. VALIDATION LAYER (Disambiguation Logic)
    if (validateOnly) {
      const validationPrompt = `You are a medical classifier for "${category}".
        The user typed: "${lastMessage}".
        
        RULES:
        1. If input is 100% correct and specific for a ${category}, status: "VALID", validatedName: "[Official Name]".
        2. If input is a typo or partial match (e.g. "bron" for "Bronchitis"), status: "SUGGEST", validatedName: "[Most likely Correct Name]".
        3. If input is completely irrelevant or vague, status: "INVALID", validatedName: null.
        
        Return ONLY JSON: {"status": "VALID" | "SUGGEST" | "INVALID", "validatedName": "string"}`;

      const validation = await groq.chat.completions.create({
        messages: [{ role: "system", content: validationPrompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(validation.choices[0]?.message?.content || '{"status": "INVALID"}');
      return NextResponse.json(result);
    }

    // 2. NORMAL CHAT LOGIC
    const medicalContext = `You are a helpful health information assistant for "Asclepius AI".
    Follow these rules strictly:
    1. Answer in exactly 2 to 3 sentences total.
    2. Use language that a non-medical person can understand.
    3. Provide exactly 3 short follow-up questions for the user.
    4. YOU MUST RESPOND IN JSON: {"reply": "...", "followUps": ["q1", "q2", "q3"]}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: medicalContext }, ...messages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const content = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return NextResponse.json({
      response: content.reply,
      followUps: content.followUps
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}