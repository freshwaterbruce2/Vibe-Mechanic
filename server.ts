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
      if (resultData && typeof resultData === 'object') {
        const key = Object.keys(resultData).find(k => k.toLowerCase() === 'youtubesearchqueries' || k.toLowerCase() === 'youtubesearch' || k.toLowerCase() === 'youtubequeries');
        if (key && key !== 'youtubeSearchQueries') {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `${year || ''} ${make || ''} ${model || ''} ${symptoms || ''} repair DIY`.trim() || "vehicle diagnostics tutorial"
          ];
        }
      }
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

// API Route: OBD-II Code Lookup & Diagnosis
app.post("/api/obd2", async (req, res) => {
  try {
    const { code, year, make, model, engine } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "OBD-II Code is required." });
    }

    const formattedCode = code.trim().toUpperCase();
    let vehicleContext = (year && make && model) ? `on a ${year} ${make} ${model}` : 'on a generic vehicle';
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
    } catch (apiError: any) {
      if (apiError.status === 503 || apiError.message?.includes('503')) {
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
      const text = response.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      resultData = JSON.parse(text);
      if (resultData && typeof resultData === 'object') {
        const key = Object.keys(resultData).find(k => k.toLowerCase() === 'youtubesearchqueries' || k.toLowerCase() === 'youtubesearch' || k.toLowerCase() === 'youtubequeries');
        if (key && key !== 'youtubeSearchQueries') {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `how to fix ${formattedCode} ${year || ''} ${make || ''} ${model || ''}`.trim()
          ];
        }
      }
    } catch(e) {
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
  } catch (error: any) {
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
- "RetailerOptions": Array of objects. Each object has "Retailer" (String, e.g., "Amazon", "AutoZone", "RockAuto"), "Url" (String) and "EstimatedPrice" (String).
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
      if (resultData && typeof resultData === 'object') {
        const key = Object.keys(resultData).find(k => k.toLowerCase() === 'youtubesearchqueries' || k.toLowerCase() === 'youtubesearch' || k.toLowerCase() === 'youtubequeries');
        if (key && key !== 'youtubeSearchQueries') {
          resultData.youtubeSearchQueries = resultData[key];
        }
        if (!resultData.youtubeSearchQueries || !Array.isArray(resultData.youtubeSearchQueries)) {
          resultData.youtubeSearchQueries = [
            `${year || ''} ${make || ''} ${model || ''} ${resultData.PartName || 'part'} replacement`.trim()
          ];
        }
      }
    } catch(e) {
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
  } catch (error: any) {
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

// API Route: Fluid Specifications, Bolt Torques, and Mechanical Gaps Database
app.post("/api/specs", async (req, res) => {
  try {
    const { year, make, model, engine } = req.body;
    
    let vehicle = (year && make && model) ? `${year} ${make} ${model}` : 'a generic vehicle';
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
    } catch (apiError: any) {
      if (apiError.status === 503 || apiError.message?.includes('503')) {
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
      const text = response.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
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
  } catch (error: any) {
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

// API Route: Custom Mileage Maintenance Intervals Generator
app.post("/api/maintenance", async (req, res) => {
  try {
    const { year, make, model, engine, mileage } = req.body;
    
    let vehicle = (year && make && model) ? `${year} ${make} ${model}` : 'a generic vehicle';
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
    } catch (apiError: any) {
      if (apiError.status === 503 || apiError.message?.includes('503')) {
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
      const text = response.text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
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
  } catch (error: any) {
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

// API Route: NVH Acoustic Engine Sound Diagnostic Classification
app.post("/api/diagnose-sound", async (req, res) => {
  try {
    const { year, make, model, engine, soundType, context } = req.body;
    
    let vehicle = (year && make && model) ? `${year} ${make} ${model}` : 'a generic vehicle';
    if (year && make && model && engine) {
      vehicle = `${year} ${make} ${model} ${engine}`;
    }

    const prompt = `You are an expert ASE Master Certified diagnostic mechanic specializing in NVH (Noise, Vibration, and Harshness) profiling.
A user indicates their ${vehicle} makes a classic abnormal mechanical noise.

The primary sound category is defined as: "${soundType}"
And they describe the context / symptoms as: "${context || 'No additional context provided'}"

Please analyze this vehicle acoustic signature and provide a comprehensive, direct, and reassurance-focused response in strict JSON format with these exact properties:
- "LikelyIssue": String. A clear mechanical diagnosis label (e.g. "Serpentine Accessory Belt Slippage", "Hydraulic Lifter Tick/Wear", "Connecting Rod Bearing Knock", "Exhaust Heat Shield Resonance").
- "AcousticReasoning": String (Markdown format). Explain why this specific sound occurs in relation to the engine's mechanical components and why the listed symptoms form this diagnosis.
- "Severity": String. Must be one of: "Low" (harmless, repair at leisure), "Moderate" (performance loss risk, repair soon), "High" (catastrophic breakdown risk, do not drive long distances), or "Critical" (imminent engine failure, tow immediately).
- "DiyTest": String. A practical DIY physical test the operator can do to confirm (e.g. "Spray water on the serpentine belt to see if sound goes away", "Use a screwdriver as a makeshift stethoscope against the block").
- "RequiredTools": Array of Strings. Tools needed for the repair.
- "SafetyWarnings": Array of Strings. Key safety warnings for this repair.
- "EstimatedTime": String. E.g., "1-2 hours".
- "EstimatedCost": Object with "Parts" (String), "Labor" (String), and "Total" (String).
- "StepByStepGuide": Array of Strings. Numbered, highly detailed, professional-grade diagnostic/replacement steps to fix this problem.
- "youtubeSearchQueries": Array of Strings. 1 to 2 precise search queries for YouTube tutorials on repairing this exact sound/issue.`;

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
        console.warn("Gemini is overloaded on sound query, using flash-lite fallback...");
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
    } catch (e) {
      resultData = {
        LikelyIssue: "Potential Accessory or Valve Defect",
        AcousticReasoning: "The acoustic frequency matches components linked with standard rotational mechanics of " + vehicle + ".",
        Severity: "Moderate",
        DiyTest: "Carefully inspect pulleys and accessory belts with a bright light while running. Use caution around spinning shafts.",
        RequiredTools: ["Flashlight", "Basic socket set", "Safety glasses"],
        SafetyWarnings: ["Keep hands/hair clear of spinning drive belt items", "Engine components are extremely hot"],
        EstimatedTime: "1-3 hours",
        EstimatedCost: { Parts: "Varies", Labor: "Varies", Total: "Varies" },
        StepByStepGuide: [
          "Safely pull the vehicle onto level ground and set the parking brake.",
          "Open the hood and inspect for obvious visual components wearing down or leaking near belts or pulleys.",
          "Check engine oil levels - under-lubrication can prompt intensive clicking/ticking sounds.",
          "If noise persists, visit a qualified local technician to avoid internal damages."
        ],
        youtubeSearchQueries: [vehicle + " " + soundType + " noise noise diagnosis"]
      };
    }

    res.json(resultData);
  } catch (error: any) {
    console.error("Error in /api/diagnose-sound:", error);
    res.json({
      LikelyIssue: "Service Temporarily Offline",
      AcousticReasoning: "We could not reach the NVH diagnostic model at this time.",
      Severity: "Low",
      DiyTest: "Check fluid levels manually.",
      RequiredTools: [],
      SafetyWarnings: [],
      EstimatedTime: "N/A",
      EstimatedCost: { Parts: "N/A", Labor: "N/A", Total: "N/A" },
      StepByStepGuide: ["Could not process sound signatures at this moment. Please try again."],
      youtubeSearchQueries: []
    });
  }
});

// API Route: Dynamic Fuse Box finder and Electrical layout generator
app.post("/api/fusebox", async (req, res) => {
  try {
    const { year, make, model, engine, system } = req.body;
    
    let vehicle = (year && make && model) ? `${year} ${make} ${model}` : 'a generic vehicle';
    if (year && make && model && engine) {
      vehicle = `${year} ${make} ${model} ${engine}`;
    }

    const prompt = `You are a certified master automotive electrician specializing in terminal junctions.
A user is dealing with an electrical component issue regarding "${system || 'all systems'}" on their ${vehicle}.

Generate an accurate, structured schematic representing the vehicle's electrical fuse block grids (provide TWO fuse boxes: one representing the standard under-hood compartment, and one representing the cabin dashboard/interior fuse box).
Provide this response strictly in JSON format with this exact layout:
- "suggestedCandidate": Object showing the most likely single blown fuse related to "${system || 'all'}" (with properties "boxName", "fuseId", "name", "amperage", "description", "actionGuide"). If no system is requested, default to listing a generic accessory fuse like "CIGAR lighter / 12V Outlet".
- "boxes": Array of TWO fuse boxes. Each box object must have:
  - "name": String (e.g., "Engine Bay Fuse Block" or "Passenger Cabin Junction Block").
  - "location": String (Detailed physical location, e.g. "Under hood, driver side next to the air intake filter" or "Left kick-panel by passenger footwell").
  - "fuses": Array of 12 distinct fuses representing a structured schematic grid (arrange them in structured rows and columns from 1 to 4). Each fuse object in the grid must contain:
    - "id": String (e.g. "F1", "F12", "F22").
    - "name": String (Common OEM labels of circuits, e.g., "AUDIO", "HORN", "WIPERS", "INJ", "IGN", "ABS", "ACC", "AC COMP", "HEATER", "DOME LIGHT", "HAZARDS", "SPARE").
    - "amperage": String (Standard ratings: "7.5A", "10A", "15A", "20A", "25A", "30A", "40A").
    - "row": Number (1 to 4).
    - "col": Number (1 to 3).
    - "description": String. What important module/feature this single circuit protects.
- "replacementGuide": Array of Strings. Step-by-step instructions on how to locate, test with a test light/multimeter, pull, inspect, and replace a micro/mini blown blade fuse safely on this vehicle.`;

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
        console.warn("Gemini is overloaded on fuse logic, using fallback...");
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
    } catch (e) {
      // Robust mock fallback representing standard layouts
      resultData = {
        suggestedCandidate: {
          boxName: "Passenger Cabin Junction Block",
          fuseId: "F15",
          name: "ACC SOCKET / CIGAR",
          amperage: "15A",
          description: "Powers accessory 12V sockets and USB power accessories.",
          actionGuide: "Use the fuse puller tool located in the engine bay box, pull F15, checks for a broken metal wire bridge inside the glass window."
        },
        boxes: [
          {
            name: "Engine Bay Fuse Block",
            location: "Under hood, back-left corner adjacent to the vehicle battery terminal.",
            fuses: [
              { id: "F1", name: "HORN", amperage: "10A", row: 1, col: 1, description: "Protects dual-tone vehicle horn assembly." },
              { id: "F2", name: "EFI / ECM", amperage: "25A", row: 1, col: 2, description: "Electronic Fuel Injection and core engine mapping chip power." },
              { id: "F3", name: "WIPER", amperage: "20A", row: 1, col: 3, description: "Windshield wiper motor torque power lines." },
              { id: "F4", name: "A/C COMP", amperage: "15A", row: 2, col: 1, description: "Powers the air conditioning electromagnetic clutch actuator." },
              { id: "F5", name: "ABS", amperage: "30A", row: 2, col: 2, description: "Anti-lock brake hydraulic modulator solenoid rails." },
              { id: "F6", name: "HEADLIGHT LH", amperage: "15A", row: 2, col: 3, description: "Left-hand side primary low/high beam bulb." },
              { id: "F7", name: "HEADLIGHT RH", amperage: "15A", row: 3, col: 1, description: "Right-hand side primary low/high beam bulb." },
              { id: "F8", name: "COOLING FAN", amperage: "30A", row: 3, col: 2, description: "Electric radiator coolant pull motor circuit." },
              { id: "F9", name: "IGN", amperage: "15A", row: 3, col: 3, description: "Ignition system spark plugs coil pack direct feed lines." },
              { id: "F10", name: "SPARE 1", amperage: "10A", row: 4, col: 1, description: "Blank template replacement accessory fuse." },
              { id: "F11", name: "SPARE 2", amperage: "15A", row: 4, col: 2, description: "Blank template replacement accessory fuse." },
              { id: "F12", name: "SPARE 3", amperage: "20A", row: 4, col: 3, description: "Blank template replacement accessory fuse." }
            ]
          },
          {
            name: "Passenger Cabin Junction Block",
            location: "Behind retractable plastic access hatch inside side wall of driver footwell.",
            fuses: [
              { id: "F13", name: "AUDIO / RADIO", amperage: "15A", row: 1, col: 1, description: "Infotainment display unit, speakers, and radio memory." },
              { id: "F14", name: "DOME LIGHT", amperage: "7.5A", row: 1, col: 2, description: "High roof interior cabin lighting and door triggers." },
              { id: "F15", name: "ACC SOCKET", amperage: "15A", row: 1, col: 3, description: "12V cigar sockets, phone port nodes, center tray connector." },
              { id: "F16", name: "HEATER / HVAC", amperage: "30A", row: 2, col: 1, description: "Interior environmental fan motor and heater vents controller." },
              { id: "F17", name: "TAIL LIGHTS", amperage: "10A", row: 2, col: 2, description: "Rear running light bulbs, license numbers plate tags illumination." },
              { id: "F18", name: "METER / GAUGE", amperage: "7.5A", row: 2, col: 3, description: "Driver cluster dashboard status screens, dials and gauges." },
              { id: "F19", name: "SRS AIRBAG", amperage: "10A", row: 3, col: 1, description: "Supplementary restraint curtains control processor." },
              { id: "F20", name: "LOCKS / BODY", amperage: "20A", row: 3, col: 2, description: "Solenoid power for doors door lock actuation nodes." },
              { id: "F21", name: "WINDOWS", amperage: "25A", row: 3, col: 3, description: "Driver side and passenger glass slider lift motor current lines." },
              { id: "F22", name: "OBD-II FEED", amperage: "10A", row: 4, col: 1, description: "12V unswitched terminal on DLC tool reader connector." },
              { id: "F23", name: "MIRROR ACC", amperage: "7.5A", row: 4, col: 2, description: "Power side mirrors adjustment switches and defroster." },
              { id: "F24", name: "SPARE 4", amperage: "10A", row: 4, col: 3, description: "Blank replacement fuse." }
            ]
          }
        ],
        replacementGuide: [
          "Ensure the ignition is clicked fully off. Pull key out of chamber.",
          "Locate corresponding fuse block panel (footwell or engine bay casing). Unlatch plastic clip tabs.",
          "Refer to target ID from schematic locator above (e.g. F15 for socket).",
          "Using a plastic fuse puller tool (located in engine bay holder trim), grasp fuse body and pull straight outwards.",
          "Hold blade fuse towards a light source: inspect if metallic loop is fractured or has dark scorch points.",
          "If broken, push a identical amperage (same color/number) blade fuse down into the slot firmly.",
          "Start your engine to verify the circuit powers on. Snap cover elements back into position."
        ]
      };
    }

    res.json(resultData);
  } catch (error: any) {
    console.error("Error in /api/fusebox:", error);
    res.json({
      boxes: [],
      replacementGuide: ["Fuses diagnostic database offline relative with connectivity lines. Please check manually."]
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
