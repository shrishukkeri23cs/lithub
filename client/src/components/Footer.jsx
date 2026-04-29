import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-12 text-center text-sm text-gray-500 border-t border-white/5 fade-in">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-left mb-8">
        <div>
          <h4 className="text-brand-amber mb-4 uppercase tracking-widest text-lg font-bold">LitHub</h4>
          <p className="text-slate-500 dark:text-gray-400 text-base leading-relaxed mt-2">
            The next generation academic discovery engine. Aggregating the world's research literature and datasets in one place.
          </p>
        </div>
        <div>
          <h4 className="text-brand-amber mb-4 uppercase tracking-widest text-lg font-bold">Resources</h4>
          <ul className="space-y-3 text-base text-slate-500 dark:text-gray-400 mt-2">
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">API Access</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Dataset Index</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-brand-amber mb-4 uppercase tracking-widest text-lg font-bold">Connect</h4>
          <ul className="space-y-3 text-base text-slate-500 dark:text-gray-400 mt-2">
            <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
            <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-white/5 text-center">
        &copy; {new Date().getFullYear()} LitHub. Built for the future of research.
      </div>
    </footer>
  );
};

export default Footer;
