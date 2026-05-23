var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
app.post("/api/diagnose", async (req, res) => {
  try {
    const { year, make, model, engine, symptoms } = req.body;
    if (!symptoms) {
      return res.status(400).json({ error: "Symptoms are required." });
    }
    let vehicleContext = year && make && model ? `${year} ${make} ${model}` : "a generic vehicle";
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
    } catch (apiError) {
      if (apiError.status === 503 || apiError.message?.includes("503")) {
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
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      resultData = JSON.parse(text);
      if (resultData && typeof resultData === "object") {
        const key = Object.keys(resultData).find((k) => k.toLowerCase() === "youtubesearchqueries" || k.toLowerCase() === "youtubesearch" || k.toLowerCase() === "youtubequeries");
        if (key && key !== "youtubeSearchQueries") {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `${year || ""} ${make || ""} ${model || ""} ${symptoms || ""} repair DIY`.trim() || "vehicle diagnostics tutorial"
          ];
        }
      }
    } catch (e) {
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
  } catch (error) {
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
app.post("/api/obd2", async (req, res) => {
  try {
    const { code, year, make, model, engine } = req.body;
    if (!code) {
      return res.status(400).json({ error: "OBD-II Code is required." });
    }
    const formattedCode = code.trim().toUpperCase();
    let vehicleContext = year && make && model ? `on a ${year} ${make} ${model}` : "on a generic vehicle";
    if (year && make && model && engine) {
      vehicleContext = `on a ${year} ${make} ${model} ${engine}`;
    }
    const prompt = `You are a master certified technician and OBD-II diagnostics specialist.
A user has requested help diagnosing the OBD-II Trouble Code (DTC): "${formattedCode}" ${vehicleContext}.

Please analyze this DTC and provide a direct, comprehensive response in strict JSON format with these exact properties:
- "Code": String. E.g. "P0171".
- "Definition": String. E.g. "System Too Lean (Bank 1)".
- "Severity": String. Must be one of: "Low" (harmless sensor error, OK to drive), "Moderate" (performance issue, repair soon), "Severe" (possible engine damage over time, avoid long trips), or "Critical" (catastrophic damage risk, stop driving immediately).
- "Explanation": String (Markdown format). What does this code mean, and why did the ECU trigger it? Mention vehicle-specific context or common patterns if ${vehicleContext} has well-known causes for this DTC.
- "CommonSymptoms": Array of Strings. Leading visual/audio/tactile symptoms the user might notice.
- "PossibleCauses": Array of Strings. Likely mechanical or electrical root causes.
- "RecommendedFixes": Array of Strings. Step-by-step prioritized checklist for diagnosing and resolving.
- "EstimatedRepairCost": String. Estimated DIY parts vs professional garage labor expense.
- "PartsSearchUrl": String. A direct search URL (e.g., Amazon, RockAuto, or AutoZone) for replacement parts most commonly bought for this DTC (e.g. oxygen sensor, spark plug, coil pack).
- "RetailerOptions": Array of objects. Each object has "Retailer" (String, e.g., "Amazon", "AutoZone", "RockAuto"), "Url" (String) and "EstimatedPrice" (String).
- "youtubeSearchQueries": Array of Strings. 1 to 2 precise, direct YouTube search queries for fixing this specific code ${vehicleContext}.

Keep the tone expert, helpful, clear, and reassuring.`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError) {
      if (apiError.status === 503 || apiError.message?.includes("503")) {
        console.warn("Gemini 3 Flash Preview is overloaded during DTC lookup, falling back to gemini-3.1-flash-lite...");
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
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      resultData = JSON.parse(text);
      if (resultData && typeof resultData === "object") {
        const key = Object.keys(resultData).find((k) => k.toLowerCase() === "youtubesearchqueries" || k.toLowerCase() === "youtubesearch" || k.toLowerCase() === "youtubequeries");
        if (key && key !== "youtubeSearchQueries") {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `how to fix ${formattedCode} ${year || ""} ${make || ""} ${model || ""}`.trim()
          ];
        }
      }
    } catch (e) {
      resultData = {
        Code: formattedCode,
        Definition: "Diagnostic Trouble Code Details",
        Severity: "Moderate",
        Explanation: response ? response.text : `Information regarding OBD-II Code ${formattedCode} could not be fully parsed.`,
        CommonSymptoms: ["Rough idle", "Check engine light illuminated"],
        PossibleCauses: ["Faulty sensor", "Wiring issue", "Vacuum or fuel supply issue"],
        RecommendedFixes: ["Inspect freeze frame data using scanner", "Clear code check if it returns"],
        EstimatedRepairCost: "Parts: Varies | Labor: Varies",
        PartsSearchUrl: `https://www.amazon.com/s?k=${formattedCode}+sensor+part`,
        RetailerOptions: [
          { Retailer: "Amazon", Url: `https://www.amazon.com/s?k=${formattedCode}+part`, EstimatedPrice: "$20 - $120" },
          { Retailer: "AutoZone", Url: "https://www.autozone.com", EstimatedPrice: "Competitive" }
        ],
        youtubeSearchQueries: [`how to fix ${formattedCode}`.trim()]
      };
    }
    res.json(resultData);
  } catch (error) {
    console.error("Error in /api/obd2:", error);
    res.json({
      Code: req.body?.code || "Error",
      Definition: "Service Unavailable",
      Severity: "Moderate",
      Explanation: `**Service Unavailable:** We are currently experiencing high demand (${error.message}). Please try again in a moment.`,
      CommonSymptoms: ["Unspecified"],
      PossibleCauses: ["API rate limiting", "High service demand"],
      RecommendedFixes: ["Please try again shortly"],
      EstimatedRepairCost: "Unknown",
      PartsSearchUrl: "",
      RetailerOptions: [],
      youtubeSearchQueries: []
    });
  }
});
app.post("/api/vision", async (req, res) => {
  try {
    const { imageBase64, mimeType, year, make, model, engine, context } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image is required." });
    }
    let vehicleContext = year && make && model ? `${year} ${make} ${model}` : "a vehicle";
    if (year && make && model && engine) {
      vehicleContext = `${year} ${make} ${model} ${engine}`;
    }
    const extraContext = context ? ` The user also noted: "${context}".` : "";
    const prompt = `You are an expert auto mechanic and automotive parts specialist.
The user has uploaded an image of a car part or an area of ${vehicleContext}.${extraContext}

Please analyze the image and provide the following in strict JSON format with these exact properties:
- "PartName": String. The name of the part in the image.
- "PrimaryFunction": String. A brief explanation of what this part does.
- "VisibleCondition": String. Assessment of its condition based on the image (e.g., worn, broken, leaking, normal).
- "PartsSearchUrl": String. A direct search URL (e.g. Amazon, RockAuto) for ordering a replacement part.
- "RetailerOptions": Array of objects. Each object has "Retailer" (String, e.g., "Amazon", "AutoZone", "RockAuto"), "Url" (String) and "EstimatedPrice" (String).
- "ReplacementDifficulty": Number. Scale of 1 to 5 (1 being easiest, 5 being hardest).
- "ImmediateNextSteps": String. Advice on what to do next (replace, repair, further diagnosis).
- "youtubeSearchQueries": Array of strings. 1 to 2 search queries for YouTube tutorials related to repairing or replacing this part.`;
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || "image/jpeg"
            }
          },
          prompt
        ],
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError) {
      if (apiError.status === 503 || apiError.message?.includes("503")) {
        console.warn("Gemini 3 Flash Preview is overloaded, falling back to gemini-3.1-flash-lite for vision...");
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || "image/jpeg"
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
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      resultData = JSON.parse(text);
      if (resultData && typeof resultData === "object") {
        const key = Object.keys(resultData).find((k) => k.toLowerCase() === "youtubesearchqueries" || k.toLowerCase() === "youtubesearch" || k.toLowerCase() === "youtubequeries");
        if (key && key !== "youtubeSearchQueries") {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `${year || ""} ${make || ""} ${model || ""} ${resultData.PartName || "part"} replacement`.trim()
          ];
        }
      }
    } catch (e) {
      resultData = {
        PartName: "Unknown Part",
        PrimaryFunction: "Could not be determined.",
        VisibleCondition: "Could not be assessed.",
        PartsSearchUrl: "",
        RetailerOptions: [],
        ReplacementDifficulty: 0,
        ImmediateNextSteps: "Please try again with a clearer image.",
        youtubeSearchQueries: [`${year} ${make} ${model} part replacement`.trim()]
      };
    }
    res.json(resultData);
  } catch (error) {
    console.error("Error in /api/vision:", error);
    res.json({
      PartName: "Service Unavailable",
      PrimaryFunction: `We are currently experiencing high demand (${error.message}).`,
      VisibleCondition: "Could not be assessed.",
      PartsSearchUrl: "",
      RetailerOptions: [],
      ReplacementDifficulty: 0,
      ImmediateNextSteps: "Please try again in a moment.",
      youtubeSearchQueries: []
    });
  }
});
app.post("/api/specs", async (req, res) => {
  try {
    const { year, make, model, engine } = req.body;
    let vehicle = year && make && model ? `${year} ${make} ${model}` : "a generic vehicle";
    if (year && make && model && engine) {
      vehicle = `${year} ${make} ${model} ${engine}`;
    }
    const prompt = `You are an expert ASE Master Certified Technician and specifications specialist.
A user has asked for the exact fluid specifications, capacities, torque ratings, and technical specs for ${vehicle}.

Please provide a highly accurate and comprehensive response in strict JSON format with these exact properties:
- "oil_capacity": String. E.g., "5.7 Liters (6.0 Quarts) with filter".
- "oil_type": String. E.g., "SAE 0W-20 (Full Synthetic)".
- "spark_plug_gap": String. E.g., "0.044 inches (1.1 mm)".
- "lug_nut_torque": String. E.g., "80 - 90 ft-lbs (108 - 122 Nm) on cold studs".
- "coolant_type": String. E.g., "Toyota Super Long Life Pink Coolant or equivalent".
- "transmission_fluid": String. E.g., "Toyota ATF WS (Lifetime fluid, sealed transmission)".
- "brake_fluid": String. E.g., "DOT 3 or DOT 4".
- "power_steering_fluid": String. E.g., "Electric power steering (No fluid required) or Dexron VI ATF".
- "tire_pressure_front_rear": String. E.g., "33 PSI Front / 33 PSI Rear (Cold)".
- "belt_diagram_info": String (Markdown format). Describe the serpentine belt inspection, routing checks, and tension checking guidelines.
- "diy_safety_index": String. One of: "Green" (very safe, standard hand tools), "Amber" (requires jack stands & eye protection), or "Red" (high voltage warnings, engine hot risk, advanced technical difficulty).
- "expert_tips": String (Markdown format). Mention vehicle-specific technical advisory service bulletins (TSBs), known failure modes (such as ignition coil wear, coolant pump squeaks, oil consumption), or practical tips for this engine/model.

Provide the exact technical data matching manufacture standards. Be as specific as possible if this is a known vehicle.`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError) {
      if (apiError.status === 503 || apiError.message?.includes("503")) {
        console.warn("Gemini is overloaded during specs lookup, using flash-lite fallback...");
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
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      resultData = JSON.parse(text);
    } catch (e) {
      resultData = {
        oil_capacity: "4.5 Quarts (4.2 Liters) with filter",
        oil_type: "5W-30 Synthetic Blend or Full Synthetic",
        spark_plug_gap: "0.040 inches (1.0 mm)",
        lug_nut_torque: "80 ft-lbs (108 Nm)",
        coolant_type: "Universal long life ethylene glycol (50/50 mix)",
        transmission_fluid: "Multi-vehicle synthetic ATF",
        brake_fluid: "DOT 3",
        power_steering_fluid: "Power steering fluid with conditioners",
        tire_pressure_front_rear: "32 PSI (Cold)",
        belt_diagram_info: "Inspect the serpentine accessory belt for hairline cracks or fraying. Ensure the automatic spring belt tensioner pulley has smooth action and aligns correctly.",
        diy_safety_index: "Amber",
        expert_tips: "Remember to lubricate gaskets before assembly and hand-tighten filters to avoid threads sticking. Double test your brake pedal after bleeding systems before shifting gear."
      };
    }
    res.json(resultData);
  } catch (error) {
    console.error("Error in /api/specs:", error);
    res.json({
      oil_capacity: "Refer to manual",
      oil_type: "Refer to manual",
      spark_plug_gap: "Refer to manual",
      lug_nut_torque: "Refer to manual",
      coolant_type: "Refer to manual",
      transmission_fluid: "Refer to manual",
      brake_fluid: "Refer to manual",
      power_steering_fluid: "Refer to manual",
      tire_pressure_front_rear: "30-35 PSI",
      belt_diagram_info: "Standard serpentine routing inspection required.",
      diy_safety_index: "Amber",
      expert_tips: "Could not request active specifications from diagnostic database. Please try again in brief."
    });
  }
});
app.post("/api/maintenance", async (req, res) => {
  try {
    const { year, make, model, engine, mileage } = req.body;
    let vehicle = year && make && model ? `${year} ${make} ${model}` : "a generic vehicle";
    if (year && make && model && engine) {
      vehicle = `${year} ${make} ${model} ${engine}`;
    }
    const currentMileage = mileage ? mileage : "unknown";
    const prompt = `You are a certified dealer master mechanic. 
A customer wants to inspect their ${vehicle} which currently has ${currentMileage} miles.

Please generate a list of 5-8 relevant, priority-based maintenance schedule points and technical checkpoints specifically for their vehicle and mileage cluster.
Return this strictly in JSON format with these exact properties:
- "mileage_selected": String or Number. E.g., "${currentMileage}".
- "urgency": String. E.g. "Routine Service Required", "Heavy Fluid Inspection Active", etc.
- "intro": String. A professional, reassuring summary of what this interval represents for this car's lifespan (e.g. 100k major tune-up).
- "checklist": Array of Objects. Each object MUST contain:
  - "item": String (E.g. "Spark Plug Replacement", "Coolant System Flush").
  - "action": String (e.g., "Replace", "Inspect", "Service", "Clean").
  - "criticality": String (Must be: "Low", "Medium", or "High").
  - "diy_difficulty": String (Must be: "Easy", "Medium", or "Hard").
  - "why_it_matters": String. A direct sentence explaining why this detail is crucial for the car's integrity.
  - "estimated_diy_time": String (E.g., "30 minutes").
- "overall_maintenance_summary": String (Markdown format). Provide final summary, professional maintenance suggestions for driving style (e.g. severe driving schedules vs light road trips), and timing belt vs timing chain notes for ${vehicle}.`;
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (apiError) {
      if (apiError.status === 503 || apiError.message?.includes("503")) {
        console.warn("Gemini is overloaded on maintenance query, using flash-lite fallback...");
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
      const text = response.text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      resultData = JSON.parse(text);
    } catch (e) {
      resultData = {
        mileage_selected: currentMileage,
        urgency: "Standard Service",
        intro: "Custom maintenance profile details calculated from standard manufacturer service periods.",
        checklist: [
          {
            item: "Engine Oil and Filter Replacement",
            action: "Replace",
            criticality: "High",
            diy_difficulty: "Easy",
            why_it_matters: "Engine lubricant breaks down with temperature and shear forces, causing accelerated bearing metal wear.",
            estimated_diy_time: "30 minutes"
          },
          {
            item: "Cabin Air Filter Replacement",
            action: "Replace",
            criticality: "Low",
            diy_difficulty: "Easy",
            why_it_matters: "Clogged environmental filters reduce blower motor efficiency and fail to filter pollen or roadway soot details.",
            estimated_diy_time: "10 minutes"
          },
          {
            item: "Brake Lining & Rotor Safety Inspection",
            action: "Inspect",
            criticality: "High",
            diy_difficulty: "Medium",
            why_it_matters: "Uneven wear limits safety in emergency braking maneuvers.",
            estimated_diy_time: "20 minutes"
          }
        ],
        overall_maintenance_summary: "For standard safety, check your fluid level lines and oil color every 1,000 miles."
      };
    }
    res.json(resultData);
  } catch (error) {
    console.error("Error in /api/maintenance:", error);
    res.json({
      mileage_selected: req.body?.mileage || "Standard",
      urgency: "System Offline",
      intro: "We were unable to build a live predictive maintenance program at this moment. Standard generic recommendations apply.",
      checklist: [
        {
          item: "Engine Oil and Filter",
          action: "Replace",
          criticality: "High",
          diy_difficulty: "Easy",
          why_it_matters: "General preservation requirement.",
          estimated_diy_time: "30-45 minutes"
        }
      ],
      overall_maintenance_summary: "Please consult standard owners handbook schedules."
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
