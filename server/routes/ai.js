const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration for local Ollama instance
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'Gemma4:latest'; // Matches user's local Ollama instance

router.post('/survey', async (req, res) => {
  const { items, groupName, researchLevel = 'deep' } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items provided for analysis' });
  }

  // Construct a grounding context from the metadata
  const context = items.map((item, index) => {
    return `[Document ${index + 1}]
Title: ${item.title}
Authors: ${item.authors || 'Unknown'}
Year: ${item.year || 'N/A'}
Source: ${item.source}
Abstract/Description: ${item.abstract || item.description || 'No abstract available.'}
---`;
  }).join('\n');

  const levelConfigs = {
    quick: {
      temperature: 0.2,
      num_ctx: 8192,
      num_predict: 1200,
      systemPersona: "You are a Lead Bibliometric Analyst. Your output is a formal executive brief for a scientific advisory board.",
      instruction: `Focus on objective takeaways and core methodological trends.
1. EXECUTIVE SUMMARY: A high-integrity overview of the research landscape.
2. DOMINANT THEMES: The 3 most statistically significant research domains.
3. METHODOLOGICAL SNAPSHOT: One technical sentence per source, focused on the primary approach.
4. SCHOLARLY FRONTIER: One sentence on the immediate future direction indicated by this set.
STRICT: Formal language only. No conversational phrasing or "Sure, here is..." introductions.`
    },
    deep: {
      temperature: 0.1,
      num_ctx: 8192,
      num_predict: 4000,
      systemPersona: "You are a Senior Academic Systematist. Your task is a rigorous Systematic Literature Review (SLR) for high-impact publication.",
      instruction: `Perform a sophisticated thematic and methodological synthesis.
1. THEMATIC CLUSTERS: Group findings into three rigorous, mutually exclusive categories.
2. DETAILED METHODOLOGY: For each source, explicitly outline the core experiments, datasets used, and algorithmic architectures/models.
3. KEY FINDINGS & METRICS: Highlight the most crucial empirical results, performance metrics, and pivotal discoveries.
4. COMPARATIVE RIGOR: Contrast the experimental designs, biases, and empirical disagreements across the sources.
5. EXPLICIT LIMITATIONS & RESEARCH VOIDS: Formally identify acknowledged limitations within the papers and precisely where the current data lacks evidentiary support.
6. STATE-OF-THE-ART (SOTA) ASSESSMENT: An objective judgment of current progress within this group and future trajectory.
STRICT: Citation required for every analytical claim: [Document X]. Zero conversational filler.`
    }
  };

  const config = levelConfigs[researchLevel] || levelConfigs.deep;

  const promptSystem = `AUTHORITY: ${config.systemPersona}
CRITICAL PROTOCOLS:
- PROFESSIONAL TONE: Use formal, industry-standard academic English.
- NO EMOJIS OR ICONS: Strictly forbid the use of any non-alphanumeric decorative characters.
- ZERO CONVERSATION: Do NOT provide an introduction, outro, or conversational meta-commentary. Start directly with the analysis.
- ZERO HALLUCINATION: Only utilize facts present in the provided metadata.
- CITATION REQUIREMENT: Support every analytical claim with its source index [Document X].
- STRUCTURE: Use standard Markdown hierarchical headers (#, ##, ###).

Produce the systematic analysis directly based on the user's provided context and goal.`;

  const promptUser = `[RESEARCH SCOPE]
Vault Group: "${groupName || 'Academic Library'}"
Intensity: ${researchLevel.toUpperCase()}
Goal: ${config.instruction}

[GROUNDING CONTEXT]
---
${context}
---

Provide the systematic analysis now. Start immediately with the formatted report.`;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: MODEL,
      messages: [
        { role: 'system', content: promptSystem },
        { role: 'user', content: promptUser }
      ],
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.num_predict,
        num_ctx: config.num_ctx
      }
    }, {
      timeout: 300000 // 5 minutes timeout
    });

    const generatedText = response.data.message?.content || '';

    if (!generatedText.trim()) {
      throw new Error("Model generated an empty response. This may indicate a context formatting mismatch or an unsupported token sequence.");
    }

    res.json({ 
      report: generatedText,
      model: response.data.model,
      created_at: response.data.created_at,
      level: researchLevel
    });
  } catch (error) {
    console.error('[AI Survey Error]:', error.message);
    const detail = error.code === 'ECONNABORTED' 
      ? 'The AI analysis timed out (over 5 mins). Try selecting fewer documents or Quick Research mode.'
      : error.code === 'ECONNREFUSED'
      ? 'Ollama is not running. Please start Ollama on localhost:11434.'
      : error.message;
    res.status(500).json({ error: 'AI analysis failed', detail });
  }
});

module.exports = router;
