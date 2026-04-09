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
      const validationPrompt = `You are a strict Medical Data Validator. Your sole purpose is to ensure the user input belongs EXCLUSIVELY to the "${category}" category.

USER INPUT: "${lastMessage}"

THE CATEGORICAL WALL:
1. If Category is "Symptoms": Accept only signs/sensations (e.g., Fever, Nausea, Fatigue).
   - !! VIOLATION !!: If the user types a DISEASE (e.g., "Flu", "Covid", "Diabetes"), or a typo of a disease (e.g., "broncitis"), you MUST return "INVALID". 
   - DO NOT suggest the correct spelling of a disease if the current category is Symptoms.

2. If Category is "Disease": Accept only clinical diagnoses (e.g., Asthma, Malaria).
   - !! VIOLATION !!: If the user types a SYMPTOM (e.g., "Cough", "Headache"), you MUST return "INVALID".

3. If Category is "Health Habits": Accept only lifestyle actions (e.g., Smoking, Exercise).

STRICT STATUS LOGIC:
- "VALID": Input is a 100% correct match for the "${category}" category.
- "SUGGEST": Input has a typo/shorthand BUT THE INTENDED WORD BELONGS TO "${category}".
- "INVALID": Input belongs to a DIFFERENT medical category, or is non-medical/vague.

EXAMPLE OF CORRECT BEHAVIOUR:
- Category: Symptoms | Input: "Broncitis" -> Result: {"status": "INVALID", "validatedName": null} (Reason: Bronchitis is a Disease, not a Symptom).
- Category: Symptoms | Input: "Coughin" -> Result: {"status": "SUGGEST", "validatedName": "Cough"} (Reason: Cough is a Symptom).

Respond ONLY with JSON: {"status": "VALID" | "SUGGEST" | "INVALID", "validatedName": "string"}`;

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
    3. Provide exactly 3 short follow-up questions that user can ask you, they must not be directed at the user.
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