// script.ts
// Ensure this matches your .env.local key
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  try {
    const response = await fetch(url);
    const data = await response.json() as any;
    
    // Check if the API returned an error object instead of models
    if (data.error) {
      console.error("Google API Error:", JSON.stringify(data.error, null, 2));
      return;
    }

    if (!data.models) {
      console.log("No models found in the response. Full response:", data);
      return;
    }

    console.log("Available Models:");
    data.models.forEach((model: any) => {
      console.log(`- ${model.name} (${model.displayName})`);
    });
  } catch (error) {
    console.error("Network or Script Error:", error);
  }
}

listModels();
