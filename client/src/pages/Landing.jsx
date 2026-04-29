import React from 'react';
import { Search, Database, FileText } from 'lucide-react';
import Logo from '../components/Logo';

const Landing = ({ isDarkMode }) => {
  return (
    <div className="pt-44 md:pt-28 pb-12 px-6 min-h-[calc(100vh-100px)] flex flex-col justify-center">
      <div className="max-w-6xl w-full mx-auto text-center space-y-10">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-serif tracking-tight leading-[1.1] py-2 overflow-visible reveal-1 flex flex-col items-center">
            Ignite Your Research
            <span className="amber-gradient-text italic inline-flex items-center justify-center gap-6 mt-4">
              with <Logo isDarkMode={isDarkMode} className="h-[1.2em] object-contain -translate-y-1" />
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-gray-400 max-w-3xl mx-auto font-light leading-relaxed reveal-2">
            The all-in-one academic literature hub. Search millions of papers,
            discover related datasets, and build your surveys in minutes.
          </p>

          {/* Provider Cards */}
          <div className="flex flex-wrap justify-center items-center gap-5 pt-10 pb-4 w-full max-w-5xl mx-auto reveal-3">
            {[
              { name: 'Semantic Scholar', color: 'bg-blue-500', iconPath: '/logos/semantic-scholar.svg', sizing: 'w-[3.5rem] h-[3.5rem] p-1.5' },
              { name: 'OpenAlex', color: 'bg-purple-500', iconPath: '/logos/openalex.svg', sizing: 'w-12 h-12 p-2' },
              { name: 'ArXiv', color: 'bg-red-500', iconPath: '/logos/arxiv.svg', sizing: 'w-[3.25rem] h-[3.25rem] p-1.5' },
              { name: 'PubMed', color: 'bg-green-500', iconPath: '/logos/pubmed.svg', sizing: 'w-12 h-12 p-1.5' },
              { name: 'Crossref', color: 'bg-brand-amber', iconPath: '/logos/crossref.svg', sizing: 'w-[2.75rem] h-[2.75rem] p-1' }
            ].map((provider) => (
              <div key={provider.name} className="flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/10 rounded-3xl w-36 h-36 p-4 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 hover:border-brand-amber/50 cursor-default group backdrop-blur-xl relative overflow-hidden text-center">
                <div className={`absolute top-0 left-0 w-full h-1.5 opacity-30 group-hover:opacity-100 transition-opacity duration-500 ${provider.color}`}></div>
                <div className="h-16 w-full flex items-center justify-center mb-1">
                  <img
                    src={provider.iconPath}
                    alt={provider.name}
                    className={`object-contain transition-transform duration-300 group-hover:-translate-y-1 dark:bg-white dark:rounded-2xl dark:shadow-md ${provider.sizing}`}
                  />
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-gray-100 tracking-tight leading-tight">{provider.name}</span>
                {provider.detail && <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-mono mt-1 opacity-90">{provider.detail}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid - Wider to fit all nicely */}
        <div className="grid md:grid-cols-3 gap-10 pt-6 reveal-4">
          <FeatureCard
            icon={<Search className="w-9 h-9 text-brand-amber" />}
            title="Smart Discovery"
            description="Deep keyword search across Semantic Scholar, OpenAlex, and arXiv. Find exactly what you need."
          />
          <FeatureCard
            icon={<Database className="w-9 h-9 text-brand-amber" />}
            title="Dataset Integration"
            description="Linked datasets from Zenodo and Papers With Code. Verify findings with raw data instantly."
          />
          <FeatureCard
            icon={<FileText className="w-9 h-9 text-brand-amber" />}
            title="Survey Builder"
            description="Organize papers into literature surveys. Export citations in IEEE, Springer, or BibTeX format."
          />
        </div>


      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="glass-card hover-lift p-6 md:p-8 rounded-3xl text-left group flex flex-col justify-between">
    <div className="mb-6 p-4 bg-brand-amber/10 rounded-2xl w-fit group-hover:bg-brand-amber/20 transition-all duration-500 group-hover:scale-110">
      {icon}
    </div>
    <div>
      <h3 className="text-xl md:text-2xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 dark:text-gray-400 text-sm md:text-base leading-relaxed font-medium">
        {description}
      </p>
    </div>
  </div>
);

export default Landing;
