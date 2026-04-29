const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile'; // Free tier, matches high-quality research output

router.post('/survey', async (req, res) => {
  const { items, groupName, researchLevel = 'deep' } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items provided for analysis' });
  }

  // Build grounding context from paper/dataset metadata
  const context = items.map((item, i) => `[Document ${i+1}]
Title: ${item.title}
Authors: ${item.authors || 'Unknown'}
Year: ${item.year || 'N/A'}
Source: ${item.source}
Abstract: ${item.abstract || item.description || 'No abstract available.'}
---`).join('\n');

  const levelConfigs = {
    quick: {
      temperature: 0.2, max_tokens: 1200,
      systemPersona: "You are a Lead Bibliometric Analyst producing a formal executive brief.",
      instruction: `1. EXECUTIVE SUMMARY: Overview of the research landscape.
2. DOMINANT THEMES: The 3 most significant research domains.
3. METHODOLOGICAL SNAPSHOT: One technical sentence per source.
4. SCHOLARLY FRONTIER: One sentence on future direction.
STRICT: Formal language. No conversational phrasing.`
    },
    deep: {
      temperature: 0.1, max_tokens: 4000,
      systemPersona: "You are a Senior Academic Systematist producing a rigorous Systematic Literature Review.",
      instruction: `1. THEMATIC CLUSTERS: Three mutually exclusive categories.
2. DETAILED METHODOLOGY: Experiments, datasets, architectures per source.
3. KEY FINDINGS & METRICS: Crucial results and performance metrics.
4. COMPARATIVE RIGOR: Contrast designs, biases, empirical disagreements.
5. LIMITATIONS & RESEARCH VOIDS: Gaps in the current literature.
6. SOTA ASSESSMENT: Current progress and future trajectory.
STRICT: Cite every claim as [Document X]. Zero conversational filler.`
    }
  };

  const config = levelConfigs[researchLevel] || levelConfigs.deep;

  const systemPrompt = `AUTHORITY: ${config.systemPersona}
PROTOCOLS: Formal academic English. No emojis. No intro/outro. 
Only use facts from provided metadata. Support claims with [Document X].
Use Markdown headers (#, ##, ###). Start directly with the analysis.`;

  const userPrompt = `Vault Group: "${groupName || 'Academic Library'}"
Intensity: ${researchLevel.toUpperCase()}
Goal: ${config.instruction}

[GROUNDING CONTEXT]
${context}

Provide the systematic analysis now. Start immediately.`;

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: config.temperature,
      max_tokens: config.max_tokens
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });

    const generatedText = response.data.choices[0]?.message?.content || '';

    if (!generatedText.trim()) {
      throw new Error('Model returned empty response.');
    }

    res.json({
      report: generatedText,
      model: MODEL,
      created_at: new Date().toISOString(),
      level: researchLevel
    });

  } catch (error) {
    console.error('[AI Survey Error]:', error.message);
    const detail = error.response?.status === 429
      ? 'Rate limit reached. Try again in 1 minute (Groq free tier: 30 req/min).'
      : error.response?.status === 401
      ? 'Invalid GROQ_API_KEY. Check your Render environment variables.'
      : error.message;
    res.status(500).json({ error: 'AI analysis failed', detail });
  }
});

module.exports = router;
