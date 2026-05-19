import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Route: Guided Troubleshooting
app.post("/api/diagnose", async (req, res) => {
  try {
    const { year, make, model, engine, symptoms } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required." });
    }

    let vehicleContext = (year && make && model) ? `${year} ${make} ${model}` : 'a generic vehicle';
    if (year && make && model && engine) {
      vehicleContext = `${year} ${make} ${model} ${engine}`;
    }
    
    const prompt = `You are an expert, certified auto mechanic. 
A user is describing symptoms for ${vehicleContext}: "${symptoms}".

Please provide a structured response in strict JSON format with the following exact properties:
- "DiagnosisInfo": String (Markdown format). Possible Causes, Recommended Diagnostic Steps, and Potential Repair Costs.
- "RequiredTools": Array of Strings. Tools needed for the repair.
- "SafetyWarnings": Array of Strings. Key safety warnings (e.g., disconnecting battery, jack stands).
- "EstimatedTime": String. E.g., "1-2 hours".
- "EstimatedCostBreakdown": Object with "Parts" (String), "Labor" (String), and "Total" (String).
- "PartsSearchUrl": String. A direct search URL (e.g. Amazon, AutoZone, or RockAuto) for the likely parts needed.
- "StepByStepGuide": Array of Strings. Numbered, highly detailed actionable steps for the repair. (Include markdown formatting inside strings if needed).
- "youtubeSearchQueries": Array of Strings. 1 to 3 search queries for YouTube tutorials for diagnosing or fixing this issue for this specific vehicle.

Keep the tone helpful, professional, and accessible to a combination of DIYers and professional mechanics.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError: any) {
      if (apiError.status === 503 || apiError.message?.includes('503')) {
        console.warn("Gemini 3 Flash Preview is overloaded, falling back to gemini-3.1-flash-lite...");
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
      } else {
        throw apiError;
      }
    }

    let resultData;
    try {
      const text = response.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      resultData = JSON.parse(text);
    } catch(e) {
      // Fallback
      resultData = { 
        DiagnosisInfo: response ? response.text : "We encountered an issue attempting to parse the diagnosis. Please try again.", 
        RequiredTools: [],
        SafetyWarnings: [],
        EstimatedTime: "Unknown",
        EstimatedCostBreakdown: { Parts: "Unknown", Labor: "Unknown", Total: "Unknown" },
        PartsSearchUrl: "",
        StepByStepGuide: [],
        youtubeSearchQueries: [`${year} ${make} ${model} ${symptoms}`.trim()] 
      };
    }

    res.json(resultData);
  } catch (error: any) {
    console.error("Error in /api/diagnose:", error);
    res.json({
      DiagnosisInfo: `**Service Unavailable:** We are currently experiencing high demand (${error.message}). Please try again in a moment.`,
      RequiredTools: [],
      SafetyWarnings: [],
      EstimatedTime: "Unknown",
      EstimatedCostBreakdown: { Parts: "Unknown", Labor: "Unknown", Total: "Unknown" },
      PartsSearchUrl: "",
      StepByStepGuide: [],
      youtubeSearchQueries: []
    });
  }
});

// API Route: Vision Part Identification
app.post("/api/vision", async (req, res) => {
  try {
    const { imageBase64, mimeType, year, make, model, engine, context } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Image is required." });
    }

    let vehicleContext = (year && make && model) ? `${year} ${make} ${model}` : 'a vehicle';
    if (year && make && model && engine) {
      vehicleContext = `${year} ${make} ${model} ${engine}`;
    }
    const extraContext = context ? ` The user also noted: "${context}".` : '';
    
    const prompt = `You are an expert auto mechanic and automotive parts specialist.
The user has uploaded an image of a car part or an area of ${vehicleContext}.${extraContext}

Please analyze the image and provide the following in strict JSON format with these exact properties:
- "PartName": String. The name of the part in the image.
- "PrimaryFunction": String. A brief explanation of what this part does.
- "VisibleCondition": String. Assessment of its condition based on the image (e.g., worn, broken, leaking, normal).
- "PartsSearchUrl": String. A direct search URL (e.g. Amazon, RockAuto) for ordering a replacement part.
- "ReplacementDifficulty": Number. Scale of 1 to 5 (1 being easiest, 5 being hardest).
- "ImmediateNextSteps": String. Advice on what to do next (replace, repair, further diagnosis).
- "youtubeSearchQueries": Array of strings. 1 to 2 search queries for YouTube tutorials related to repairing or replacing this part.`;

    // Remove base64 data url prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "image/jpeg",
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError: any) {
      if (apiError.status === 503 || apiError.message?.includes('503')) {
        console.warn("Gemini 3 Flash Preview is overloaded, falling back to gemini-3.1-flash-lite for vision...");
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg",
              }
            },
            prompt
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
      } else {
        throw apiError;
      }
    }

    let resultData;
    try {
      const text = response.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      resultData = JSON.parse(text);
    } catch(e) {
      resultData = { 
        PartName: "Unknown Part",
        PrimaryFunction: "Could not be determined.",
        VisibleCondition: "Could not be assessed.",
        PartsSearchUrl: "",
        ReplacementDifficulty: 0,
        ImmediateNextSteps: "Please try again with a clearer image.",
        youtubeSearchQueries: [`${year} ${make} ${model} part replacement`.trim()] 
      };
    }

    res.json(resultData);
  } catch (error: any) {
    console.error("Error in /api/vision:", error);
    res.json({
      PartName: "Service Unavailable",
      PrimaryFunction: `We are currently experiencing high demand (${error.message}).`,
      VisibleCondition: "Could not be assessed.",
      PartsSearchUrl: "",
      ReplacementDifficulty: 0,
      ImmediateNextSteps: "Please try again in a moment.",
      youtubeSearchQueries: []
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
