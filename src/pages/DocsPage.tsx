import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, Copy, CheckCheck, ArrowLeft, Terminal, FileCode 
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sampleChangePayload = `{
  "id": "chg_90210_node_1092837",
  "area_id": "area_90210",
  "change_type": "business_opened",
  "entity_type": "node",
  "entity_id": "node/1092837",
  "title": "Beverly Roasting Co.",
  "description": "New cafe opened at 240 N Rodeo Dr",
  "confidence": 0.98,
  "significance_score": 85,
  "event_date": "2024-03-15T08:00:00Z",
  "new_data": {
    "name": "Beverly Roasting Co.",
    "category": "cafe",
    "address": "240 N Rodeo Dr, Beverly Hills, CA 90210",
    "latitude": 34.0736,
    "longitude": -118.4004
  }
}`;

  const sampleQuery = `// Example client query to resolve area changes
const res = await fetch('https://api.whatchanged.io/v1/areas/90210/changes?period=5y');
const data = await res.json();
console.log(\`Found \${data.changes.length} verified place events\`);`;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      
      {/* Top Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-sans">
            Developer Documentation & Schemas
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            Technical reference for spatial snapshots, change detection entities, and demographic schemas
          </p>
        </div>
      </div>

      {/* Main Documentation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-mono text-xs">
        
        {/* Core Entity Schema */}
        <div className="mono-card p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-white" />
              <span>Change Entity Schema (JSON)</span>
            </h2>
            <button
              onClick={() => copyCode('schema', sampleChangePayload)}
              className="btn-interactive text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 cursor-pointer"
            >
              {copiedSection === 'schema' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'schema' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 overflow-x-auto text-zinc-300 text-[11px] leading-relaxed">
            <code>{sampleChangePayload}</code>
          </pre>
        </div>

        {/* Integration Fetch Example */}
        <div className="mono-card p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-white" />
              <span>Client Query Example</span>
            </h2>
            <button
              onClick={() => copyCode('fetch', sampleQuery)}
              className="btn-interactive text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800 cursor-pointer"
            >
              {copiedSection === 'fetch' ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSection === 'fetch' ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 overflow-x-auto text-zinc-300 text-[11px] leading-relaxed">
            <code>{sampleQuery}</code>
          </pre>
        </div>

        {/* Scoring Scale */}
        <div className="mono-card p-6 rounded-2xl border border-zinc-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Code className="w-4 h-4 text-white" />
            <span>Significance Weight Calculation</span>
          </h2>
          <div className="space-y-2 text-zinc-300 font-sans text-xs">
            <p>
              Significance is scored deterministically on a 0–100 scale taking into account:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <strong className="text-white block mb-1">Civic & Medical</strong>
                <span className="text-zinc-400">Hospitals, Clinics, Schools, Libraries (80–95 pts)</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <strong className="text-white block mb-1">Major Food & Retail</strong>
                <span className="text-zinc-400">Supermarkets, Department Stores (70–85 pts)</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <strong className="text-white block mb-1">Dining & Cafes</strong>
                <span className="text-zinc-400">Restaurants, Cafes, Bakeries (60–80 pts)</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <strong className="text-white block mb-1">Specialty Boutiques</strong>
                <span className="text-zinc-400">Local services & shops (40–65 pts)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
