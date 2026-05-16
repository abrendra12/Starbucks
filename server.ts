import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// --- MOCK DATA ---
const MENU_DATA = [
  { id: "pumpkin-spice-latte", name: "Pumpkin Spice Latte", category: "hot", temperature: "hot", description: "Our signature espresso and steamed milk with pumpkin spice sauce.", tags: ["seasonal", "warm", "spiced"] },
  { id: "iced-caffe-americano", name: "Iced Caffè Americano", category: "cold", temperature: "cold", description: "Espresso shots topped with cold water and ice.", tags: ["classic", "strong", "sugar-free"] },
  { id: "mango-dragonfruit-refresher", name: "Mango Dragonfruit Refresher", category: "refresher", temperature: "cold", description: "Tropical mango and dragonfruit flavours shaken with ice.", tags: ["fruity", "refreshing", "vegan"] },
  { id: "oat-milk-latte", name: "Oat Milk Latte", category: "hot", temperature: "both", description: "A creamy plant-based espresso drink.", tags: ["creamy", "dairy-free", "classic"] },
  { id: "matcha-tea-latte", name: "Iced Matcha Tea Latte", category: "tea", temperature: "both", description: "Smooth and creamy matcha sweetened just right.", tags: ["smooth", "earthy", "refreshing"] },
  { id: "caramel-frappuccino", name: "Caramel Frappuccino", category: "frappuccino", temperature: "cold", description: "Coffee, milk and ice blended with buttery caramel syrup.", tags: ["sweet", "indulgent", "creamy"] }
];

const OFFERS_DATA = [
  { id: "bonus-stars-refresher", title: "Refresher Reward", description: "Earn 25 Bonus Stars on any Refresher purchase.", bonus: 25, expiry: "2026-05-20" },
  { id: "double-star-day", title: "Double Star Thursday", description: "Earn 2x Stars on your entire order all day.", bonus: "2x", expiry: "2026-05-18" },
  { id: "latte-love", title: "Latte Lover", description: "50% off your second latte when you buy one.", bonus: "50% Off", expiry: "2026-05-25" }
];

// --- API ENDPOINTS ---

// 1. Drink Search
app.post("/api/search", async (req: Request, res: Response) => {
  const { query, context } = req.body;
  
  const systemPrompt = `
    You are the Starbucks drink finder. Your job is to understand a customer's natural language drink request and return the best matching drinks from the Starbucks menu.
    RULES:
    - Always return a JSON object. No markdown, no explanation, no preamble.
    - Return between 1 and 6 drink results, ranked by relevance.
    - Each result must include: id, name, category, temperature, description (max 15 words), tags, confidence_score (0.0–1.0).
    - Map customer language: "not too sweet" -> low_sweetness, "strong" -> high_caffeine, etc.
    - If the query mentions dietary needs, add a dietary_filters array.
    - If the query is off-topic, return {"error": "off_topic"}.
  `;

  const userPrompt = `
    Customer query: "${query}"
    Context: ${JSON.stringify(context || {})}
    MENU_REFERENCE: ${JSON.stringify(MENU_DATA)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(result.text || "{}");
    if (data.error === "off_topic") {
       return res.status(400).json({ error: "Sorry, I can only help with Starbucks drink requests!" });
    }
    res.json(data);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search menu" });
  }
});

// 2. Chatbot (Siren)
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, context } = req.body;

  const systemInstruction = `
    You are Siren, the Starbucks virtual assistant. You are warm, helpful, and on-brand.
    PERSONALITY: Concise (2-4 sentences), encouraging, friendly barista.
    CONTEXT: ${JSON.stringify(context)}
    RULES: Never discuss competitors. For severe allergies, advise checking with baristas.
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    // Send only the last user message for simplicity in this example, 
    // or properly map full history if needed. 
    // Here we'll pass the message directly.
    const lastMessage = messages[messages.length - 1].text;
    const response = await chat.sendMessage({ message: lastMessage });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Siren is busy right now." });
  }
});

// 3. Hero Copy
app.post("/api/hero", async (req: Request, res: Response) => {
  const { season, drink } = req.body;

  const systemInstruction = `
    You are a Starbucks brand copywriter. Write punchy, on-brand homepage hero copy.
    VOICE: Warm, inviting, short sentences. Never use "delicious", "amazing".
    SCHEMA: { headline, subheading, primary_cta, secondary_cta, alt_headlines }
  `;

  const userPrompt = `
    Season: ${season}
    Featured drink: ${drink.name}
    Drink description: ${drink.description}
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.85,
        responseMimeType: "application/json"
      }
    });
    res.json(JSON.parse(result.text || "{}"));
  } catch (error) {
    res.json({
      headline: "Fall into Flavor",
      subheading: "Your favorite seasonal sips are back for a limited time.",
      primary_cta: "Order Now",
      secondary_cta: "Find a Store"
    });
  }
});

// 4. Offer Ranker
app.post("/api/offers", async (req: Request, res: Response) => {
  const { profile } = req.body;

  const systemInstruction = `
    You are a Starbucks personalisation engine. Rank offers from most to least relevant.
    CRITERIA: Alignment with categories, expiring soonest, highest Star value.
    RESPONSE_SCHEMA: { ranked_offer_ids, top_offer_reason }
  `;

  const userPrompt = `
    Customer profile: ${JSON.stringify(profile)}
    Available offers: ${JSON.stringify(OFFERS_DATA)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });
    res.json(JSON.parse(result.text || "{}"));
  } catch (error) {
    res.json({ ranked_offer_ids: OFFERS_DATA.map(o => o.id), top_offer_reason: "Recommended based on your history." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
