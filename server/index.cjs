const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/generate-description", async (req, res) => {
  try {
    const { subcategory } = req.body;

    if (!subcategory) {
      return res.status(400).json({ error: "Missing subcategory" });
    }

    const prompt = `Δώσε μου μία σύντομη περιγραφή για την υποκατηγορία προπόνησης "${subcategory}", και πρότεινε ένα Tier πρόσβασης (Free, Silver, Gold, Platinum).`;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const aiText = chatResponse.choices[0].message.content;

    // Σπάμε την απάντηση σε 2 μέρη: περιγραφή + tier
    const tierMatch = aiText.match(/(Free|Silver|Gold|Platinum)/i);
    const tier = tierMatch ? tierMatch[0] : "Free";
    const text = aiText.replace(tierMatch?.[0], "").trim();

    res.json({ text, tier });
  } catch (error) {
    console.error("🔥 API Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
