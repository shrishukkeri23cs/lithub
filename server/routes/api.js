const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const NodeCache = require('node-cache');
const router = express.Router();

// Configure cache (5 minutes TTL)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Configure Axios with retry logic for rate limits (429)
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  }
});

// --- Papers Search ---
router.get('/search/papers', async (req, res, next) => {
  const { q, limit = 15, minYear, maxYear, providers } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  // Convert comma-separated string to array
  const activeProviders = providers ? providers.split(',') : ['semantic-scholar', 'openalex', 'pubmed', 'crossref'];

  const cacheKey = `papers_${q}_${limit}_${minYear}_${maxYear}_${providers}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  console.log(`[Search] Query: "${q}", Providers: [${activeProviders.join(', ')}]`);

  try {
    const paperMap = new Map(); // Use map for deduplication by title/doi
    let warnings = [];

    const fetchPromises = [];

    // 1. Fetch from Semantic Scholar
    if (activeProviders.includes('semantic-scholar')) {
      fetchPromises.push((async () => {
        let ssParams = {
          query: q,
          limit,
          fields: 'title,authors,year,abstract,url,venue,citationCount,externalIds'
        };
        if (minYear && maxYear) ssParams.year = `${minYear}-${maxYear}`;
        else if (minYear) ssParams.year = `${minYear}-`;
        else if (maxYear) ssParams.year = `-${maxYear}`;

        try {
          const ssRes = await axios.get('https://api.semanticscholar.org/graph/v1/paper/search', { params: ssParams });
          const ssData = ssRes.data?.data || [];
          console.log(`[Semantic Scholar] Found ${ssData.length} results`);
          
          ssData.forEach(p => {
            paperMap.set(p.title.toLowerCase(), {
              id: p.paperId || p.externalIds?.DOI,
              title: p.title,
              authors: p.authors?.map(a => a.name).join(', '),
              year: p.year,
              abstract: p.abstract,
              url: p.url,
              venue: p.venue,
              citations: p.citationCount || 0,
              source: 'Semantic Scholar',
              doi: p.externalIds?.DOI
            });
          });
        } catch (err) {
          console.error(`[Semantic Scholar] Error: ${err.response?.status || err.message}`);
          if (err.response?.status === 429) warnings.push('Semantic Scholar');
        }
      })());
    }

    // 2. Fetch from OpenAlex
    if (activeProviders.includes('openalex')) {
      fetchPromises.push((async () => {
        let oaParams = { search: q, per_page: limit };
        if (minYear || maxYear) {
          let filter = [];
          if (minYear) filter.push(`from_publication_date:${minYear}-01-01`);
          if (maxYear) filter.push(`to_publication_date:${maxYear}-12-31`);
          oaParams.filter = filter.join(',');
        }

        try {
          const oaRes = await axios.get('https://api.openalex.org/works', { params: oaParams });
          const oaData = oaRes.data?.results || [];
          console.log(`[OpenAlex] Found ${oaData.length} results`);

          oaData.forEach(p => {
            const key = p.display_name.toLowerCase();
            const existing = paperMap.get(key);

            let paperUrl = p.doi || p.ids?.mag;
            if (paperUrl && !paperUrl.startsWith('http')) {
              paperUrl = paperUrl.includes('10.') ? `https://doi.org/${paperUrl}` : `https://openalex.org/W${p.id.split('/').pop()}`;
            }

            if (existing) {
              // Merge: Keep highest citation count and mark as multi-source
              existing.citations = Math.max(existing.citations, p.cited_by_count || 0);
              existing.source = existing.source.includes('OpenAlex') ? existing.source : `${existing.source} + OpenAlex`;
            } else {
              paperMap.set(key, {
                id: p.id,
                title: p.display_name,
                authors: p.authorships?.map(a => a.author.display_name).join(', '),
                year: p.publication_year, // Fallback handled securely
                abstract: '',
                url: paperUrl,
                venue: p.primary_location?.source?.display_name,
                citations: p.cited_by_count || 0,
                source: 'OpenAlex',
                doi: p.doi?.replace('https://doi.org/', '')
              });
            }
          });
        } catch (err) {
          console.error(`[OpenAlex] Error: ${err.message}`);
          if (err.response?.status === 429) warnings.push('OpenAlex');
        }
      })());
    }

    // 3. Fetch from ArXiv
    if (activeProviders.includes('arxiv')) {
      fetchPromises.push((async () => {
        try {
          const arxivRes = await axios.get('https://export.arxiv.org/api/query', {
            params: {
              search_query: `all:${q}`,
              start: 0,
              max_results: limit
            }
          });
          
          // Simple XML parser logic for ArXiv (since it returns Atom XML)
          const entries = arxivRes.data.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
          console.log(`[ArXiv] Found ${entries.length} results`);

          entries.forEach(entry => {
            const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim();
            if (!title) return;

            const key = title.toLowerCase();
            const existing = paperMap.get(key);

            const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1];
            const published = entry.match(/<published>([\s\S]*?)<\/published>/)?.[1];
            const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1]).join(', ');
            const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim();
            const pdfUrl = entry.match(/<link title="pdf" href="([\s\S]*?)"/)?.[1];

            if (existing) {
              existing.source = existing.source.includes('ArXiv') ? existing.source : `${existing.source} + ArXiv`;
            } else {
              paperMap.set(key, {
                id: id,
                title: title,
                authors: authors,
                year: published ? new Date(published).getFullYear() : null,
                abstract: summary,
                url: pdfUrl || id,
                venue: 'ArXiv',
                citations: 0, // ArXiv doesn't provide citations directly
                source: 'ArXiv'
              });
            }
          });
        } catch (err) {
          console.error(`[ArXiv] Error: ${err.message}`);
          if (err.response?.status === 429) warnings.push('ArXiv');
        }
      })());
    }

    // 4. Fetch from PubMed (via EuropePMC)
    if (activeProviders.includes('pubmed')) {
      fetchPromises.push((async () => {
        try {
          const pmcRes = await axios.get('https://www.ebi.ac.uk/europepmc/webservices/rest/search', {
            params: {
              query: q,
              format: 'json',
              resultType: 'core',
              pageSize: limit
            }
          });

          const pmcData = pmcRes.data?.resultList?.result || [];
          console.log(`[PubMed/EuropePMC] Found ${pmcData.length} results`);

          pmcData.forEach(p => {
            const title = p.title || '';
            if (!title) return;

            const key = title.toLowerCase();
            const existing = paperMap.get(key);

            if (existing) {
              existing.citations = Math.max(existing.citations, p.citedByCount || 0);
              existing.source = existing.source.includes('PubMed') ? existing.source : `${existing.source} + PubMed`;
            } else {
              paperMap.set(key, {
                id: p.pmid || p.id,
                title: title,
                authors: p.authorString,
                year: p.pubYear,
                abstract: p.abstractText || '',
                url: p.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/` : (p.doi ? `https://doi.org/${p.doi}` : ''),
                venue: p.journalTitle,
                citations: p.citedByCount || 0,
                source: 'PubMed',
                doi: p.doi
              });
            }
          });
        } catch (err) {
          console.error(`[PubMed] Error: ${err.message}`);
          warnings.push('PubMed');
        }
      })());
    }

    // 5. Fetch from Crossref
    if (activeProviders.includes('crossref')) {
      fetchPromises.push((async () => {
        try {
          const crossrefRes = await axios.get('https://api.crossref.org/works', {
            params: {
              query: q,
              rows: limit,
              select: 'title,author,published,abstract,URL,container-title,is-referenced-by-count,DOI'
            }
          });

          const crossrefData = crossrefRes.data?.message?.items || [];
          console.log(`[Crossref] Found ${crossrefData.length} results`);

          crossrefData.forEach(p => {
            const title = p.title?.[0] || '';
            if (!title) return;

            const key = title.toLowerCase();
            const existing = paperMap.get(key);

            if (existing) {
              existing.citations = Math.max(existing.citations, p['is-referenced-by-count'] || 0);
              existing.source = existing.source.includes('Crossref') ? existing.source : `${existing.source} + Crossref`;
            } else {
              const authors = p.author ? p.author.map(a => `${a.given || ''} ${a.family || ''}`.trim()).join(', ') : '';
              const year = p.published?.['date-parts']?.[0]?.[0];
              const rawAbstract = p.abstract ? p.abstract.replace(/(<([^>]+)>)/gi, '') : '';
              
              paperMap.set(key, {
                id: p.DOI,
                title: title,
                authors: authors,
                year: year,
                abstract: rawAbstract,
                url: p.URL || `https://doi.org/${p.DOI}`,
                venue: p['container-title']?.[0],
                citations: p['is-referenced-by-count'] || 0,
                source: 'Crossref',
                doi: p.DOI
              });
            }
          });
        } catch (err) {
          console.error(`[Crossref] Error: ${err.message}`);
          warnings.push('Crossref');
        }
      })());
    }

    // Await all providers concurrently
    await Promise.allSettled(fetchPromises);

    const papers = Array.from(paperMap.values());
    const sortedResult = papers.sort((a, b) => b.citations - a.citations).slice(0, limit * 2);
    
    cache.set(cacheKey, { results: sortedResult, warnings });
    res.json({ results: sortedResult, warnings });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', detail: error.message });
  }
});

// --- Datasets Search ---
router.get('/search/datasets', async (req, res, next) => {
  const { q, limit = 10, providers } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  const activeProviders = providers ? providers.split(',') : ['zenodo', 'papers-with-code'];

  const cacheKey = `datasets_${q}_${limit}_${providers}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return res.json(cachedData);

  try {
    const fetchPromises = [];

    // 1. Fetch from Zenodo
    if (activeProviders.includes('zenodo')) {
      fetchPromises.push(axios.get('https://zenodo.org/api/records', {
        params: {
          q: `type:dataset AND ${q}`,
          size: limit,
        }
      }).then(res => ({ source: 'zenodo', data: res.data })));
    }

    // 2. Fetch from Papers With Code
    if (activeProviders.includes('papers-with-code')) {
      fetchPromises.push(axios.get('https://paperswithcode.com/api/v1/datasets/', {
        params: {
          q,
          items_per_page: limit,
        }
      }).then(res => ({ source: 'pwc', data: res.data })));
    }

    const results = await Promise.allSettled(fetchPromises);

    // Normalize results
    const datasets = [];
    
    results.forEach(res => {
      if (res.status === 'fulfilled') {
        const { source, data } = res.value;
        
        if (source === 'zenodo' && data?.hits?.hits) {
          data.hits.hits.forEach(d => {
            datasets.push({
              id: d.id,
              title: d.metadata.title,
              description: d.metadata.description?.replace(/<[^>]*>?/gm, '').slice(0, 300) + '...',
              url: d.links?.html || `https://zenodo.org/record/${d.id}`,
              source: 'Zenodo',
              doi: d.doi,
              license: d.metadata.license?.id,
              creators: d.metadata.creators?.map(c => c.name).join(', ')
            });
          });
        }

        if (source === 'pwc' && data?.results) {
          data.results.forEach(d => {
            let datasetUrl = d.url;
            if (datasetUrl && !datasetUrl.startsWith('http')) {
              datasetUrl = `https://paperswithcode.com${datasetUrl}`;
            }

            datasets.push({
              id: d.id,
              title: d.name,
              description: d.description,
              url: datasetUrl,
              source: 'Papers With Code',
              license: d.license,
              creators: 'Various'
            });
          });
        }
      }
    });

    cache.set(cacheKey, datasets);
    res.json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error.message);
    res.status(500).json({ error: 'Failed to fetch datasets', detail: error.message });
  }
});

module.exports = router;
