import React, { useState, useMemo, useEffect } from 'react';
import { Bookmark, LayoutGrid, Search, Trash2, FolderPlus, Download, ExternalLink, ChevronRight, Folder, Brain, Sparkles, X, FileText, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { getLibrary, removeFromLibrary, getGroups, createGroup, deleteGroup, setItemGroup, saveGroupReview, getGroupReview } from '../utils/library';
import { downloadItem } from '../utils/download';
import { exportToDocx } from '../utils/docxExport';

const Library = () => {
  const [savedItems, setSavedItems] = useState(() => getLibrary());
  const [groups, setGroups] = useState(() => getGroups());
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [filter, setFilter] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedItemsForNewGroup, setSelectedItemsForNewGroup] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState(() => sessionStorage.getItem('lithub-active-report') || null);
  const [analysisError, setAnalysisError] = useState(null);
  const [researchLevel, setResearchLevel] = useState('deep'); // 'quick' or 'deep'
  const [isSelectingDepth, setIsSelectingDepth] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const handleDelete = (id) => {
    const updated = removeFromLibrary(id);
    setSavedItems(updated);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const updated = createGroup(newGroupName, selectedItemsForNewGroup);
    setGroups(updated);
    setSavedItems(getLibrary());
    setNewGroupName('');
    setSelectedItemsForNewGroup([]);
    setIsCreatingGroup(false);
  };

  const handleMoveToGroup = (itemId, groupId) => {
    const updated = setItemGroup(itemId, groupId === 'none' ? null : groupId);
    setSavedItems(updated);
  };

  const handleDeleteGroup = (groupId) => {
    if (window.confirm("Delete this group? Items will be moved to the general vault.")) {
      const updatedGroups = deleteGroup(groupId);
      setGroups(updatedGroups);
      setSavedItems(getLibrary());
      if (selectedGroupId === groupId) setSelectedGroupId('all');
    }
  };

  const filteredItems = useMemo(() => {
    return savedItems.filter(item => {
      const matchesFilter = item.title?.toLowerCase().includes(filter.toLowerCase()) || 
                           item.authors?.toLowerCase().includes(filter.toLowerCase());
      const matchesGroup = selectedGroupId === 'all' || item.groupId === selectedGroupId;
      return matchesFilter && matchesGroup;
    });
  }, [savedItems, selectedGroupId, filter]);

  // Auto-load cached survey when group or items change
  useEffect(() => {
    const groupItems = filteredItems;
    if (groupItems.length > 0) {
      const cached = getGroupReview(selectedGroupId, groupItems, researchLevel);
      if (cached) setAnalysisReport(cached);
      else setAnalysisReport(null);
    } else {
      setAnalysisReport(null);
    }
    setAnalysisError(null);
  }, [selectedGroupId, filteredItems.length, researchLevel]);

  // Persistence: Ensure theme toggle doesn't wipe active report
  useEffect(() => {
    if (analysisReport) {
      sessionStorage.setItem('lithub-active-report', analysisReport);
    }
  }, [analysisReport]);

  const handleGenerateSurvey = async (overrideLevel = null) => {
    const levelToUse = overrideLevel || researchLevel;
    const groupItems = filteredItems;
    if (!groupItems.length) return;

    if (isAnalyzing) {
      setShowAnalysisPanel(true);
      setIsSelectingDepth(false);
      return;
    }

    // Check Cache First
    const cached = getGroupReview(selectedGroupId, groupItems, levelToUse);
    if (cached) {
      setAnalysisReport(cached);
      setShowAnalysisPanel(true);
      return;
    }

    setIsSelectingDepth(false);
    setIsAnalyzing(true);
    setShowAnalysisPanel(true);
    setAnalysisError(null);
    setAnalysisReport(null);

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    try {
      const response = await axios.post('http://localhost:5001/api/ai/survey', {
        items: groupItems,
        groupName: selectedGroup ? selectedGroup.name : 'General Vault',
        researchLevel: levelToUse
      }, {
        timeout: 301000 // 5m 1s timeout to match server
      });
      const report = response.data.report;
      setAnalysisReport(report);
      // Cache the review permanently for this group/state
      saveGroupReview(selectedGroupId, report, groupItems, levelToUse);
    } catch (err) {
      console.error(err);
      setAnalysisError(err.response?.data?.detail || "AI analysis failed. Ensure Ollama is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold rendering: **text**
      const formattedLine = line.split(/(\*\*.*?\*\*)/).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-slate-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-serif text-[#1d4ed8] dark:text-brand-amber mb-6">{formattedLine}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-serif text-[#1d4ed8] dark:text-brand-amber mt-10 mb-4 border-b border-blue-500/10 dark:border-brand-amber/20 pb-2">{formattedLine}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3">{formattedLine}</h3>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-slate-600 dark:text-slate-400 ml-4 mb-2">{formattedLine}</li>;
      return <p key={i} className="mb-4 leading-relaxed">{formattedLine}</p>;
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-black/5 dark:border-white/5 pb-12 reveal-1">
          <div className="space-y-5">
            <div className="flex items-center space-x-3 text-brand-amber text-xs font-mono tracking-tighter font-bold">
              <Bookmark className="w-5 h-5 fill-brand-amber text-brand-amber" />
              <span className="uppercase text-sm">PERSONAL RESEARCH VAULT</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-serif">Your Research Vault</h2>
            <p className="text-slate-500 dark:text-gray-400 text-lg">Manage and organize your saved literature reviews and datasets into groups.</p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-amber transition-colors" />
              <input 
                type="text" 
                placeholder="Filter vault..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-white/5 dark:bg-brand-navy border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-12 items-start">
          {/* Sidebar: Groups */}
          <div className="lg:col-span-1 space-y-8 reveal-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Library Groups</h3>
                <button 
                  onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                  className="p-1.5 hover:bg-brand-amber/10 text-brand-amber rounded-lg transition-colors"
                  title="New Group"
                >
                  <FolderPlus className="w-5 h-5" />
                </button>
              </div>

              {isCreatingGroup && (
                <div className="glass-card p-4 rounded-2xl border-brand-amber/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <form onSubmit={handleCreateGroup} className="space-y-3">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Enter Group Name..." 
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-white/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-amber"
                    />
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Select Initial Items (Optional)</label>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {savedItems.filter(i => !i.groupId).map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              setSelectedItemsForNewGroup(prev => 
                                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                              );
                            }}
                            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer text-xs transition-all ${
                              selectedItemsForNewGroup.includes(item.id) ? 'bg-brand-amber/20 text-brand-amber' : 'hover:bg-white/5 text-gray-500'
                            }`}
                          >
                            {selectedItemsForNewGroup.includes(item.id) ? <CheckCircle2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            <span className="line-clamp-1">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" className="flex-grow bg-brand-amber text-brand-navy py-2 rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-95 transition-all">Create Group</button>
                      <button type="button" onClick={() => setIsCreatingGroup(false)} className="px-3 bg-white/5 text-gray-500 rounded-xl hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </form>
                </div>
              )}

              <nav className="space-y-1">
                <button 
                  onClick={() => setSelectedGroupId('all')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                    selectedGroupId === 'all' ? 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20' : 'hover:bg-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <LayoutGrid className="w-5 h-5" />
                    <span className="font-bold text-sm">All Items</span>
                  </div>
                  <span className="text-xs font-bold text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded-md">{savedItems.length}</span>
                </button>

                {groups.map(group => (
                  <div key={group.id} className="group flex items-center">
                    <button 
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`flex-grow flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                        selectedGroupId === group.id ? 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Folder className="w-5 h-5 transition-transform group-hover:scale-110" />
                        <span className="font-bold text-sm">{group.name}</span>
                      </div>
                      <span className="text-xs font-bold text-brand-amber bg-brand-amber/10 px-2 py-0.5 rounded-md">
                        {savedItems.filter(i => i.groupId === group.id).length}
                      </span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-500 transition-all ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </nav>

              <div className="pt-8">
                 {/* Sidebar space now clear */}
              </div>
            </div>
          </div>

          {/* Main Content: Table */}
          <div className="lg:col-span-3 space-y-4">
            {filteredItems.length > 0 ? (
              <div className="reveal-3">
                {/* AI Trigger Header Bar */}
                <div className="flex items-center justify-between mb-4 bg-white/5 dark:bg-white/2 p-4 rounded-3xl border border-white/10 min-h-[72px]">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-widest px-2 mr-2">
                       <Brain className="w-4 h-4 text-brand-amber" />
                       <span>Intelligent Synthesis</span>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setIsSelectingDepth(true)}
                      disabled={isAnalyzing || filteredItems.length === 0}
                      className={`group flex items-center space-x-3 px-8 py-3 rounded-2xl font-bold transition-all lithub-glow animate-in fade-in duration-500 ${
                        isAnalyzing 
                        ? 'opacity-80 pointer-events-none' 
                        : 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy hover:scale-[1.03] shadow-xl'
                      }`}
                    >
                      <div className="bg-brand-amber p-1.5 rounded-lg text-brand-navy">
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:animate-pulse" />}
                      </div>
                      <span className="text-sm uppercase tracking-wider">Generate Literature Survey</span>
                    </button>

                    {/* Compact Pop-up Selection (Above Button) */}
                    {isSelectingDepth && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSelectingDepth(false)}></div>
                        <div className="absolute bottom-[120%] right-0 z-50 w-64 glass-card p-4 rounded-3xl border-brand-amber/30 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 space-y-3">
                           <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Research Depth</div>
                           
                           <div className="space-y-2">
                             <button 
                               onClick={() => { setResearchLevel('quick'); handleGenerateSurvey('quick'); }}
                               className="w-full flex items-center space-x-3 p-3 rounded-2xl bg-white/5 hover:bg-brand-amber/20 transition-all text-left group"
                             >
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-brand-amber group-hover:text-brand-navy transition-all">
                                   <Sparkles className="w-4 h-4" />
                                </div>
                                <div>
                                   <div className="text-xs font-bold group-hover:text-brand-amber transition-colors">Quick Summary</div>
                                   <div className="text-[9px] text-gray-500 italic">~1 min analysis</div>
                                </div>
                             </button>

                             <button 
                               onClick={() => { setResearchLevel('deep'); handleGenerateSurvey('deep'); }}
                               className="w-full flex items-center space-x-3 p-3 rounded-2xl bg-white/5 hover:bg-brand-amber/20 transition-all text-left group"
                             >
                                <div className="p-2 bg-brand-amber/10 text-brand-amber rounded-xl group-hover:bg-brand-amber group-hover:text-brand-navy transition-all">
                                   <Brain className="w-4 h-4" />
                                </div>
                                <div>
                                   <div className="text-xs font-bold group-hover:text-brand-amber transition-colors">Deep Research</div>
                                   <div className="text-[9px] text-gray-500 italic">~5 min synthesis</div>
                                </div>
                             </button>
                           </div>
                           
                           {/* Arrow pointer */}
                           <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white/5 dark:bg-brand-navy border-r border-b border-white/10 rotate-45 backdrop-blur-md"></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-slate-500 dark:text-gray-500 text-xs uppercase tracking-widest font-bold font-mono">
                      <th className="px-6 py-2">Type</th>
                      <th className="px-6 py-2">Title / Authors</th>
                      <th className="px-6 py-2">Source</th>
                      <th className="px-6 py-2">Group</th>
                      <th className="px-6 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => window.open(item.url, '_blank')}
                        className="glass-card hover-lift group rounded-3xl cursor-pointer transition-all duration-300 border border-transparent hover:border-brand-amber/20"
                      >
                        <td className="px-6 py-6 first:rounded-l-3xl">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            item.type === 'Paper' ? 'bg-blue-500/10 text-blue-400' : 'bg-brand-amber/10 text-brand-amber'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-6 max-w-md">
                          <div className="space-y-1">
                            <div className="font-bold text-base leading-tight group-hover:text-[#1d4ed8] dark:group-hover:text-brand-amber transition-colors line-clamp-2 hover:underline underline-offset-2 decoration-[#1d4ed8]/30 dark:decoration-brand-amber/30">{item.title}</div>
                            <div className="text-slate-500 dark:text-gray-400 text-xs font-medium">{item.authors || 'Various'} • {item.year}</div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-xs text-slate-500 dark:text-gray-500 font-mono italic">
                          {item.source}
                        </td>
                        <td className="px-6 py-6 border-l border-white/5">
                          <select 
                            value={item.groupId || 'none'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleMoveToGroup(item.id, e.target.value)}
                            className="bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 outline-none hover:border-brand-amber/30 cursor-pointer transition-all"
                          >
                            <option value="none" className="bg-white dark:bg-brand-navy">Uncategorized</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.id} className="bg-white dark:bg-brand-navy">{g.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-6 text-right last:rounded-r-3xl">
                          <div className="flex items-center justify-end space-x-1">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 text-brand-amber hover:bg-brand-amber/10 rounded-xl transition-all"
                              title="Open Source"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={(e) => { e.stopPropagation(); downloadItem(item); }}
                              className="p-2.5 text-brand-amber hover:bg-brand-amber/10 rounded-xl transition-all"
                              title="Download Metadata"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                              className="p-2.5 text-slate-400 dark:text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Remove from vault"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-40 glass-card rounded-3xl space-y-8 reveal-3">
                <Bookmark className="w-20 h-20 text-slate-200 dark:text-slate-800 mx-auto opacity-50" />
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Your vault is clean</h3>
                  <p className="text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                    {filter ? "No results match your filter." : "Start discovering papers and datasets to populate your research vault."}
                  </p>
                </div>
                {!filter && (
                  <a href="/search" className="premium-button inline-block bg-brand-amber text-brand-navy px-10 py-4 rounded-2xl font-bold shadow-lg shadow-brand-amber/20">
                    Go to Discovery
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis Side Panel */}
      {showAnalysisPanel && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAnalysisPanel(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-brand-navy shadow-[0_0_50px_rgba(0,0,0,0.5)] h-full flex flex-col border-l border-slate-200 dark:border-white/10 animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
              <div className="flex items-center space-x-3 text-[#1d4ed8] dark:text-brand-amber">
                <Brain className="w-6 h-6" />
                <h3 className="text-xl font-bold uppercase tracking-widest font-mono">Systematic AI Review</h3>
              </div>
              <button 
                onClick={() => setShowAnalysisPanel(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-blue-500/20 dark:bg-brand-amber/30 animate-pulse"></div>
                    <Brain className="w-16 h-16 text-[#1d4ed8] dark:text-brand-amber relative animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-serif text-[#1d4ed8] dark:text-brand-amber">Synthetic Intelligence at Work</h4>
                    <p className="text-slate-500 dark:text-gray-400 max-w-xs mx-auto text-sm md:text-base">Aggregating methodology and common themes...</p>
                  </div>
                </div>
              ) : analysisError ? (
                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-4">
                    <Brain className="w-16 h-16 text-red-500/50 mx-auto" />
                    <h4 className="text-xl font-bold text-red-500 text-center">Analysis Terminated</h4>
                    <p className="text-red-500/80 text-sm max-w-sm mx-auto text-center">{analysisError}</p>
                    <button onClick={handleGenerateSurvey} className="w-full mt-4 bg-brand-amber text-brand-navy py-3 rounded-2xl font-bold hover:scale-105 transition-all">Retry Analysis</button>
                  </div>
              ) : (
                <article className="prose dark:prose-invert max-w-none prose-headings:font-serif prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white pb-10">
                  {renderMarkdown(analysisReport)}

                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-4">
                    <button 
                      onClick={() => navigator.clipboard.writeText(analysisReport)}
                      className="flex items-center space-x-2 px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-sm font-bold transition-all"
                    >
                      <FileText className="w-4 h-4 text-[#1d4ed8] dark:text-brand-amber" />
                      <span>Copy to Clipboard</span>
                    </button>
                    <button 
                      onClick={() => exportToDocx(analysisReport, `LitHub_Review_${selectedGroupId}`)}
                      className="flex items-center space-x-2 px-6 py-3 bg-[#1d4ed8] text-white hover:bg-blue-600 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export as .DOCX</span>
                    </button>
                  </div>
                </article>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Library;
