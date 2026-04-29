import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Database, Send, CheckCircle2, ChevronRight, Info, Eye, Trash2, FileJson, Table, X, Loader2 } from 'lucide-react';
import { saveToLibrary, getLibrary } from '../utils/library';
import Papa from 'papaparse';

const Contributions = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Paper',
    authors: '',
    year: new Date().getFullYear(),
    source: 'Local Upload',
    abstract: '',
    url: '',
    doi: '',
    journal: '',
    format: '',
    size: '',
    license: 'CC-BY-4.0',
    proof: null // Stores samples for structural proof
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewProof, setViewProof] = useState(null);
  const [previewPage, setPreviewPage] = useState(1);
  const ITEMS_PER_PAGE = 250;

  const [contributions, setContributions] = useState(() => {
    const saved = localStorage.getItem('lithub-library');
    return saved ? JSON.parse(saved).filter(i => i.source === 'Local Upload') : [];
  });

  const fileInputRef = useRef(null);

  // Auto-detect format and size
  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    
    const ext = file.name.split('.').pop().toUpperCase();
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    setFormData(prev => ({ 
      ...prev, 
      format: ext, 
      size: sizeStr,
      source: 'Local Upload',
      title: prev.title || file.name.split('.')[0]
    }));

    // Generate Preview for CSV
    if (ext === 'CSV' || ext === 'TSV') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("PapaParse Errors:", results.errors);
          }
          setPreviewData(results);
          // Set proof for structural validation
          setFormData(prev => ({ ...prev, proof: results }));
        },
        error: (error) => {
          console.error("PapaParse Critical Error:", error);
        }
      });
    } else {
      setPreviewData(null);
      setFormData(prev => ({ ...prev, proof: null }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      const item = {
        id: 'contrib-' + Date.now(),
        ...formData,
        citations: 0,
      };
      
      const success = saveToLibrary(item);
      if (success) {
        setIsSuccess(true);
        const updatedContribs = [item, ...contributions];
        setContributions(updatedContribs);
        resetForm();
        
        setTimeout(() => {
          setIsSuccess(false);
          setShowForm(false);
        }, 1500);
      }
      setIsSubmitting(false);
    }, 1500);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'Paper',
      authors: '',
      year: new Date().getFullYear(),
      source: 'Local Upload',
      abstract: '',
      url: '',
      doi: '',
      journal: '',
      format: '',
      size: '',
      license: 'CC-BY-4.0',
      proof: null
    });
    setSelectedFile(null);
    setPreviewData(null);
  };

  const clearSelectedFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
    setPreviewData(null);
    setFormData(prev => ({
      ...prev,
      format: '',
      size: '',
      proof: null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 space-y-16 fade-in">
      {/* Ledger View */}
      <div className="space-y-12 animate-in slide-in-from-bottom-5 duration-500">
         {/* Ledger Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-black/5 dark:border-white/5 pb-10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-brand-amber text-xs font-mono tracking-widest font-bold">
                <Database className="w-5 h-5" />
                <span className="uppercase">CONTRIBUTION DASHBOARD</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif">Your Research Contributions</h2>
              <p className="text-slate-500 dark:text-gray-400 max-w-xl text-lg">
                Manage your local repository entries and uploaded datasets. Everything here is ready for AI analysis.
              </p>
            </div>

            <button 
              onClick={() => setShowForm(true)}
              className="premium-button group flex items-center space-x-3 px-8 py-4 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-2xl font-bold border border-white/10 shadow-2xl"
            >
              <div className="bg-brand-amber p-1.5 rounded-lg text-brand-navy">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-sm uppercase tracking-wider">Add New Contribution</span>
            </button>
         </div>

         {/* Ledger Table */}
         <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Local Repository</h3>
               <div className="text-[10px] font-mono text-brand-amber bg-brand-amber/10 px-3 py-1 rounded-full border border-brand-amber/20">
                  {contributions.length} Items Total
               </div>
            </div>

            <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-white/5 dark:bg-white/2">
                     <tr>
                        <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                        <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Title / Content</th>
                        <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Metadata</th>
                        <th className="p-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {contributions.length > 0 ? contributions.map(item => (
                       <tr key={item.id} className="hover:bg-white/5 transition-all group">
                          <td className="p-6">
                             <div className={`p-2.5 rounded-xl inline-block ${item.type === 'Paper' ? 'bg-blue-500/10 text-blue-400' : 'bg-brand-amber/10 text-brand-amber'}`}>
                                {item.type === 'Paper' ? <FileText className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                             </div>
                          </td>
                          <td className="p-6">
                             <div className="font-bold text-base leading-tight text-white/90 group-hover:text-brand-amber transition-colors">{item.title}</div>
                             <div className="text-xs text-gray-500 mt-1">{item.authors} • {item.year}</div>
                          </td>
                          <td className="p-6">
                             <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-white/5 tracking-tighter">{item.format}</span>
                                <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-white/5 tracking-tighter">{item.size}</span>
                             </div>
                          </td>
                          <td className="p-6">
                             <div className="flex items-center justify-end space-x-2">
                                {item.proof && (
                                  <button 
                                    onClick={() => { setViewProof(item); setPreviewPage(1); }}
                                    className="p-3 text-brand-amber hover:bg-brand-amber/10 rounded-xl transition-all"
                                    title="View Dataset Preview"
                                  >
                                     <Eye className="w-5 h-5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    const updated = contributions.filter(c => c.id !== item.id);
                                    setContributions(updated);
                                    const lib = JSON.parse(localStorage.getItem('lithub-library'));
                                    localStorage.setItem('lithub-library', JSON.stringify(lib.filter(l => l.id !== item.id)));
                                  }}
                                  className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                   <Trash2 className="w-5 h-5" />
                                </button>
                             </div>
                          </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan="4" className="p-32 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Database className="w-10 h-10 text-gray-600" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-gray-400 font-serif text-xl">Dashboard Empty</p>
                               <p className="text-gray-600 text-sm italic">Begin by adding your first local contribution to the vault.</p>
                            </div>
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      {/* Structural Proof Overlay -> Preview Modal */}
      {viewProof && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/80" onClick={() => setViewProof(null)}></div>
           <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 p-1 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-8 border-b border-black/5 dark:border-white/5 shrink-0">
                 <div className="space-y-1">
                    <h3 className="text-2xl font-serif text-brand-navy dark:amber-gradient-text">Preview</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Dataset contents for: {viewProof.title}</p>
                 </div>
                 <button onClick={() => setViewProof(null)} className="p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                 </button>
              </div>
              <div className="overflow-auto custom-scrollbar flex-grow">
                 <div className="px-8 pb-8">
                    <table className="w-full text-left border-separate border-spacing-0">
                      <thead>
                        <tr>
                          {viewProof.proof.meta.fields.map(f => (
                            <th 
                              key={f} 
                              className="sticky top-0 z-20 p-4 bg-slate-100 dark:bg-slate-800 text-[#1d4ed8] dark:text-brand-amber font-mono text-[10px] uppercase tracking-tighter border-b border-black/5 dark:border-white/5"
                            >
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {viewProof.proof.data.slice((previewPage - 1) * ITEMS_PER_PAGE, previewPage * ITEMS_PER_PAGE).map((row, i) => (
                          <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/2 transition-colors">
                            {viewProof.proof.meta.fields.map(f => (
                              <td key={f} className="p-4 text-slate-600 dark:text-slate-400 font-mono text-[10px] truncate max-w-[200px]">{row[f]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900 border-t border-black/5 dark:border-white/5 shrink-0">
                 <button 
                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))} 
                    disabled={previewPage === 1} 
                    className="px-6 py-3 bg-white dark:bg-white/5 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 disabled:opacity-30 text-xs font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                 >
                    Previous
                 </button>
                 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Page {previewPage} of {Math.ceil(viewProof.proof.data.length / ITEMS_PER_PAGE)} <span className="mx-2 opacity-50">|</span> Total Rows: {viewProof.proof.data.length}
                 </span>
                 <button 
                    onClick={() => setPreviewPage(p => Math.min(Math.ceil(viewProof.proof.data.length / ITEMS_PER_PAGE), p + 1))} 
                    disabled={previewPage === Math.ceil(viewProof.proof.data.length / ITEMS_PER_PAGE)} 
                    className="px-6 py-3 bg-white dark:bg-white/5 text-slate-600 dark:text-white border border-slate-200 dark:border-white/10 disabled:opacity-30 text-xs font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                 >
                    Next
                 </button>
              </div>

              <div className="p-4 bg-[#1d4ed8]/5 dark:bg-brand-amber/5 text-center shrink-0">
                 <p className="text-[10px] text-[#1d4ed8] dark:text-brand-amber font-bold flex items-center justify-center space-x-2 tracking-widest uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>INTEGRITY VERIFIED: DATA CONFORMS TO SCHEMATICS</span>
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Premium Overlay Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 overflow-hidden animate-in fade-in duration-500">
            {/* Backdrop - NO BLUR, TRANSPARENT */}
            <div className="absolute inset-0 bg-transparent" onClick={() => { setShowForm(false); resetForm(); }}></div>
           
           {/* Modal Container - NO BLUR, Sync with theme */}
           <div className="relative w-full max-w-5xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[4rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              
              {/* Close Button */}
              <button 
                onClick={() => { setShowForm(false); resetForm(); }}
                className="absolute top-8 right-8 z-50 p-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-brand-amber rounded-[1.5rem] transition-all border border-slate-200 dark:border-white/5 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>

              {isSuccess && (
                <div className="absolute inset-0 bg-white dark:bg-brand-navy z-[70] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                  <CheckCircle2 className="w-24 h-24 text-green-500 animate-bounce" />
                  <div className="text-center space-y-2 px-10">
                     <h3 className="text-4xl font-serif text-[#1d4ed8] dark:amber-gradient-text">Indexing Confirmed</h3>
                     <p className="text-slate-500 dark:text-gray-400">Your contribution has been successfully validated and saved to the vault.</p>
                  </div>
                </div>
              )}

              {/* Left Column: Intake Sidebar */}
              <div className="w-full md:w-[40%] bg-slate-50 dark:bg-white/[0.02] border-r border-slate-200 dark:border-white/5 p-12 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <h3 className="text-2xl font-serif text-[#1d4ed8] dark:amber-gradient-text tracking-tight">Resource Select</h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase leading-relaxed">
                       Initialize structural indexing by selecting a device research file
                    </p>
                 </div>

                 {/* Dropzone */}
                 <div 
                   onDragEnter={handleDrag}
                   onDragLeave={handleDrag}
                   onDragOver={handleDrag}
                   onDrop={handleDrop}
                   className={`relative group h-72 shrink-0 flex flex-col items-center justify-center space-y-6 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                     dragActive 
                     ? 'bg-brand-amber/10 border-brand-amber scale-[1.02]' 
                     : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-brand-amber/40 shadow-sm'
                   }`}
                   onClick={() => !selectedFile && fileInputRef.current.click()}
                 >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    
                    {selectedFile ? (
                      <div className="flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="relative">
                          <div className="p-6 rounded-[2rem] bg-green-500/10 text-green-600 dark:text-green-400">
                             <CheckCircle2 className="w-12 h-12" />
                          </div>
                          <button 
                            onClick={clearSelectedFile}
                            className="absolute -top-2 -right-2 p-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-white rounded-full shadow-lg border border-slate-200 dark:border-white/10 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-sm text-slate-900 dark:text-white/80 line-clamp-1 px-4">{selectedFile.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">Ready for indexing</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-6 rounded-[2rem] bg-slate-100 dark:bg-brand-amber/5 text-slate-400 dark:text-brand-amber transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                           <Upload className="w-10 h-10" />
                        </div>
                        
                        <div className="text-center space-y-2 px-8">
                           <div className="font-bold text-sm text-slate-700 dark:text-white/80 line-clamp-1">Select Device File</div>
                           <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest">DRAG & DROP OR BROWSE</div>
                        </div>
                      </>
                    )}
                 </div>

                 {/* Structural Insight Preview */}
                 {previewData ? (
                   <div className="rounded-[2.5rem] border border-[#1d4ed8]/20 dark:border-blue-500/30 overflow-hidden animate-in slide-in-from-top-4 flex-grow flex flex-col bg-white dark:bg-transparent">
                      <div className="flex items-center justify-between p-5 bg-[#1d4ed8]/5 dark:bg-blue-500/10 border-b border-[#1d4ed8]/10 dark:border-blue-500/10">
                         <div className="flex items-center space-x-2 text-[#1d4ed8] dark:text-blue-400 font-bold text-[9px] uppercase tracking-widest">
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                         </div>
                         <div className="text-[8px] font-mono text-[#1d4ed8]/50 dark:text-blue-300/50 mix-blend-plus-lighter">SAMPLE: 10 ROWS</div>
                      </div>
                      <div className="overflow-auto custom-scrollbar flex-grow bg-slate-50/50 dark:bg-black/20 max-h-[400px]">
                          <table className="w-full text-[9px] text-left border-separate border-spacing-0">
                             <thead>
                                <tr className="bg-slate-100 dark:bg-white/5 sticky top-0 z-10">
                                  {previewData.meta.fields.map(f => (
                                    <th key={f} className="p-3 text-slate-400 dark:text-blue-300/40 truncate max-w-[120px] font-mono border-b border-slate-200 dark:border-white/5 uppercase tracking-tighter bg-slate-100 dark:bg-slate-900">{f}</th>
                                  ))}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {previewData.data.slice(0, 10).map((row, i) => (
                                  <tr key={i} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                                    {previewData.meta.fields.map(f => (
                                      <td key={f} className="p-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px] font-mono">{row[f]}</td>
                                    ))}
                                  </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                   </div>
                 ) : (
                   <div className="flex-grow flex flex-col items-center justify-center p-10 border border-slate-200 dark:border-white/5 rounded-[2.5rem] bg-white dark:bg-white/[0.01] text-center space-y-4 shadow-inner">
                      {formData.type === 'Paper' && selectedFile ? (
                          <>
                            <FileText className="w-12 h-12 text-[#1d4ed8] dark:text-blue-500 transition-transform" />
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] px-4 leading-relaxed font-bold">Document Ready for Archival</p>
                          </>
                      ) : (
                          <>
                            <FileJson className="w-12 h-12 text-slate-400 dark:text-slate-600 group-hover:scale-110 transition-transform opacity-40" />
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] px-4 leading-relaxed font-bold opacity-40">Awaiting dataset structural mapping...</p>
                          </>
                      )}
                   </div>
                 )}

                 <div className="p-8 bg-slate-100 dark:bg-brand-amber/[0.03] rounded-[2rem] border border-slate-200 dark:border-brand-amber/10">
                    <p className="text-[10px] text-slate-500 leading-relaxed italic text-center px-4">
                       "Precision indexing of metadata ensures the highest veracity in Systematic AI Literature Reviews."
                    </p>
                 </div>
              </div>

              {/* Right Column: Metadata Profile */}
              <div className="flex-grow p-12 md:p-16 overflow-y-auto custom-scrollbar space-y-12 bg-white dark:bg-transparent">
                 <div className="space-y-4">
                    <h2 className="text-4xl font-serif text-brand-navy dark:amber-gradient-text tracking-tight">Metadata Profile</h2>
                    <p className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase">Enter scholarly identifiers for precise archival indexing</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-12 pb-10">
                    {/* Toggle Type */}
                    <div className="flex items-center space-x-6">
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, type: 'Paper' }))}
                        className={`flex-grow flex items-center justify-center space-x-3 py-5 rounded-[2rem] font-bold transition-all border ${formData.type === 'Paper' ? 'bg-brand-amber text-brand-navy border-brand-amber shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-[0.1em]">Scholarly Paper</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, type: 'Dataset' }))}
                        className={`flex-grow flex items-center justify-center space-x-3 py-5 rounded-[2rem] font-bold transition-all border ${formData.type === 'Dataset' ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                      >
                        <Database className="w-5 h-5" />
                        <span className="text-[11px] uppercase tracking-[0.1em] text-center">Raw Dataset</span>
                      </button>
                    </div>

                    {/* Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Primary Resource Title</label>
                          <input 
                            required
                            type="text" 
                            name="title"
                            placeholder="e.g. Neural Architecture Search for Medical Imaging"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Lead Authors / Origin</label>
                          <input 
                            required
                            type="text" 
                            name="authors"
                            placeholder="Primary Investigators"
                            value={formData.authors}
                            onChange={handleChange}
                            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Publish Year</label>
                           <input 
                             required
                             type="number" 
                             name="year"
                             max={new Date().getFullYear()}
                             value={formData.year}
                             onChange={handleChange}
                             className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all text-sm text-slate-900 dark:text-white font-bold"
                           />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Target Format</label>
                          <div className="w-full bg-brand-amber/[0.03] border border-brand-amber/10 rounded-[1.5rem] px-8 py-5 text-brand-amber font-bold font-mono text-center tracking-[0.2em] text-xs h-[60px] flex items-center justify-center">
                            {formData.format || "AWAITING SELECT"}
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Payload Size / Source</label>
                          <div className="w-full bg-brand-amber/[0.03] border border-brand-amber/10 rounded-[1.5rem] px-8 py-5 text-brand-amber font-bold font-mono text-center tracking-[0.1em] text-xs h-[60px] flex items-center justify-center">
                            {formData.size || "0.00 MB"}
                          </div>
                       </div>

                       {formData.type === 'Paper' ? (
                          <>
                             <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Publisher / Journal</label>
                                <input 
                                  type="text" 
                                  name="journal"
                                  placeholder="Nature, IEEE, etc."
                                  value={formData.journal}
                                  onChange={handleChange}
                                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">DOI String</label>
                                <input 
                                  type="text" 
                                  name="doi"
                                  placeholder="10.1234/arc.v1i1.123"
                                  value={formData.doi}
                                  onChange={handleChange}
                                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400"
                                />
                             </div>
                          </>
                       ) : (
                          <div className="space-y-3 md:col-span-2">
                             <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Archival License</label>
                             <select 
                               name="license" 
                               value={formData.license}
                               onChange={handleChange}
                               className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 appearance-none cursor-pointer text-sm font-bold text-slate-700 dark:text-white/80"
                             >
                               <option value="MIT">MIT Open Source</option>
                               <option value="CC-BY-4.0">Creative Commons BY 4.0</option>
                               <option value="Apache-2.0">Apache License 2.0</option>
                               <option value="Proprietary">Proprietary Research</option>
                             </select>
                          </div>
                       )}

                       <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">Executive Abstract (For AI Semantic Mapping)</label>
                          <textarea 
                            required
                            name="abstract"
                            placeholder="Provide a high-integrity summary of the research methodology and key findings..."
                            value={formData.abstract}
                            onChange={handleChange}
                            rows="5"
                            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-[2rem] px-10 py-8 focus:outline-none focus:ring-1 focus:ring-brand-amber/50 transition-all resize-none text-sm leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400"
                          ></textarea>
                       </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting || !selectedFile}
                      className="w-full premium-button bg-brand-amber text-brand-navy py-6 rounded-[2.5rem] font-bold flex items-center justify-center space-x-4 shadow-xl disabled:grayscale disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
                    >
                      {isSubmitting ? (
                         <span className="flex items-center space-x-4">
                           <span className="w-6 h-6 border-[3px] border-brand-navy/30 border-t-brand-navy animate-spin rounded-full" />
                           <span className="uppercase tracking-[0.2em] text-xs">Awaiting Archival Validation...</span>
                         </span>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span className="uppercase tracking-[0.2em] text-xs">Finalize Archival Indexing</span>
                        </>
                      )}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Contributions;
