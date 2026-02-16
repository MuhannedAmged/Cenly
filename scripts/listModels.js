const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyAWHilrRTlpd4ieRnWNRGGFnv_yUy9bm10";
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // In the latest SDK, listModels is an async iterator
    console.log("Listing models...");
    const models = await genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    }); // Dummy model to get client
    // Actually the SDK doesn't expose listModels directly on the main class in some versions
    // We can try to use a direct fetch or check the version-specific way.
    // For now, let's try 'gemini-1.5-flash-latest' which is the common alias.
  } catch (error) {
    console.error("Error:", error);
  }
}

// Alternative: Try common model names
const modelsToTry = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-pro",
];

async function testModels() {
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      console.log(`✓ ${modelName} is available`);
    } catch (e) {
      console.log(`✗ ${modelName} failed: ${e.message}`);
    }
  }
}

testModels();
