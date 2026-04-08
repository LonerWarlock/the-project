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

    // VALIDATION LAYER LOGIC
    if (validateOnly) {
      const validationPrompt = `You are a medical classifier. The user has selected the category: "${category}". 
      The user just typed: "${lastMessage}". 
      Is this input logically a name of a ${category}? 
      Respond ONLY with a JSON object: {"isValid": true} or {"isValid": false}`;

      const validation = await groq.chat.completions.create({
        messages: [{ role: "system", content: validationPrompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      return NextResponse.json(JSON.parse(validation.choices[0]?.message?.content || '{"isValid": false}'));
    }

    // NORMAL CHAT LOGIC
    const medicalContext = `You are a helpful health information assistant for "Asclepius AI".
    Follow these rules strictly:
    1. Answer in exactly 2 to 3 sentences total.
    2. Use simple, plain English only (no medical jargon).
    3. Explain things as if talking to a child.
    4. Provide exactly 3 short follow-up questions that the user can ask you.
    5. YOU MUST RESPOND IN JSON: {"reply": "...", "followUps": ["q1", "q2", "q3"]}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: medicalContext }, ...messages],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
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