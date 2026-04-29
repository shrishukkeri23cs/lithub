import React, { useState } from 'react';
import { ExternalLink, Bookmark, Quote, Download, FileText, Database, Check, ChevronDown, Folder } from 'lucide-react';
import { saveToLibrary } from '../utils/library';
import { downloadItem } from '../utils/download';

export const PaperCard = ({ paper, groups = [] }) => {
  const [saved, setSaved] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const handleSave = (groupId = null) => {
    const success = saveToLibrary({ ...paper, type: 'Paper' }, groupId);
    if (success) {
      setSaved(true);
      setShowGroups(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="glass-card hover-lift p-6 rounded-2xl flex flex-col h-full group relative overflow-visible">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs uppercase tracking-tighter font-bold flex items-center space-x-1 ${
            paper.source.includes('+') 
              ? 'bg-brand-amber text-brand-navy shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
              : 'bg-white/10 text-brand-amber border border-white/5'
          }`}>
            <FileText className="w-3 h-3" />
            <span>{paper.source}</span>
          </div>
        </div>
        <div className="flex space-x-2 relative">
          <div className="relative">
            <button 
              onClick={() => groups.length > 0 ? setShowGroups(!showGroups) : handleSave()}
              title="Save to Library"
              className={`p-2 rounded-lg transition-all flex items-center space-x-1 ${
                saved 
                  ? 'bg-green-500/20 text-green-400' 
                  : (showGroups ? 'bg-brand-amber text-brand-navy' : 'bg-white/5 hover:bg-brand-amber/20 hover:text-brand-amber')
              }`}
            >
              {saved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              {groups.length > 0 && !saved && <ChevronDown className={`w-3 h-3 transition-transform ${showGroups ? 'rotate-180' : ''}`} />}
            </button>

            {showGroups && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card bg-brand-navy/95 border-brand-amber/30 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-widest px-3">Select Group</div>
                <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                  <button 
                    onClick={() => handleSave(null)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:bg-brand-amber/10 hover:text-brand-amber transition-colors flex items-center space-x-2"
                  >
                    <Folder className="w-3 h-3" />
                    <span>Uncategorized</span>
                  </button>
                  {groups.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => handleSave(g.id)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:bg-brand-amber/10 hover:text-brand-amber transition-colors flex items-center space-x-2"
                    >
                      <Folder className="w-3 h-3" />
                      <span className="line-clamp-1">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => downloadItem(paper)}
            className="p-2 bg-white/5 rounded-lg hover:bg-brand-amber/20 hover:text-brand-amber transition-colors"
            title="Download Metadata"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <a 
          href={paper.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block group-hover:no-underline"
        >
          <h3 className="text-xl font-bold leading-tight group-hover:text-brand-amber transition-colors hover:underline underline-offset-4 decoration-brand-amber/30">
            {paper.title}
          </h3>
        </a>
        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium line-clamp-1">{paper.authors}</p>
      </div>

      <div className="flex items-center justify-between pt-4 mt-auto border-t border-black/5 dark:border-white/5">
        <div className="flex items-center space-x-4 text-xs text-gray-400 font-mono">
          <span>{paper.year}</span>
          <span className="flex items-center"><Quote className="w-3 h-3 mr-1" /> {paper.citations}</span>
        </div>
        <a 
          href={paper.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-brand-amber text-sm font-bold hover:underline"
        >
          View Source <ExternalLink className="w-5 h-5 ml-1" />
        </a>
      </div>
    </div>
  );
};

export const DatasetCard = ({ dataset, groups = [] }) => {
  const [saved, setSaved] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const handleSave = (groupId = null) => {
    const success = saveToLibrary({ ...dataset, type: 'Dataset' }, groupId);
    if (success) {
      setSaved(true);
      setShowGroups(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="glass-card hover-lift p-6 rounded-2xl border-l-4 border-l-brand-amber flex flex-col h-full group relative overflow-visible">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs uppercase tracking-tighter font-bold flex items-center space-x-1 ${
            dataset.source && dataset.source.includes('+') 
              ? 'bg-brand-amber text-brand-navy shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
              : 'bg-white/10 text-brand-amber border border-white/5'
          }`}>
            <Database className="w-3 h-3" />
            <span>{dataset.source}</span>
          </div>
        </div>
        <div className="flex space-x-2 relative">
          <div className="relative">
            <button 
              onClick={() => groups.length > 0 ? setShowGroups(!showGroups) : handleSave()}
              title="Save to Library"
              className={`p-2 rounded-lg transition-all flex items-center space-x-1 ${
                saved 
                  ? 'bg-green-500/20 text-green-400' 
                  : (showGroups ? 'bg-brand-amber text-brand-navy' : 'bg-white/5 hover:bg-brand-amber/20 hover:text-brand-amber')
              }`}
            >
              {saved ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              {groups.length > 0 && !saved && <ChevronDown className={`w-3 h-3 transition-transform ${showGroups ? 'rotate-180' : ''}`} />}
            </button>

            {showGroups && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-card bg-brand-navy/95 border-brand-amber/30 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 tracking-widest px-3">Select Group</div>
                <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                  <button 
                    onClick={() => handleSave(null)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:bg-brand-amber/10 hover:text-brand-amber transition-colors flex items-center space-x-2"
                  >
                    <Folder className="w-3 h-3" />
                    <span>Uncategorized</span>
                  </button>
                  {groups.map(g => (
                    <button 
                      key={g.id}
                      onClick={() => handleSave(g.id)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-400 hover:bg-brand-amber/10 hover:text-brand-amber transition-colors flex items-center space-x-2"
                    >
                      <Folder className="w-3 h-3" />
                      <span className="line-clamp-1">{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => downloadItem(dataset)}
            className="p-2 bg-white/5 rounded-lg hover:bg-brand-amber/20 hover:text-brand-amber transition-colors"
            title="Download Metadata"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <a 
          href={dataset.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block group-hover:no-underline"
        >
          <h3 className="text-xl font-bold leading-tight border-b border-white/5 pb-2 hover:text-brand-amber transition-colors hover:underline underline-offset-4 decoration-brand-amber/30">
            {dataset.title}
          </h3>
        </a>
        <p className="text-slate-600 dark:text-gray-500 text-sm leading-relaxed line-clamp-3">
          {dataset.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 mt-auto border-t border-black/5 dark:border-white/5">
        <div className="text-xs text-gray-400 font-mono uppercase">
          License: {dataset.license || 'Open'}
        </div>
        <a 
          href={dataset.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-brand-amber text-sm font-bold hover:underline"
        >
          Access Data <ExternalLink className="w-5 h-5 ml-1" />
        </a>
      </div>
    </div>
  );
};
