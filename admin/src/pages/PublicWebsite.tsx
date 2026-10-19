import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';

export default function PublicWebsite() {
  const publicUrl = import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'http://localhost:5173';
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  const reloadIframe = () => {
    setKey((prev) => prev + 1);
  };

  const getContainerWidth = () => {
    if (device === 'mobile') return 'max-w-[375px]';
    if (device === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Guest Experience & Public Presence
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Public Website Preview
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Live preview of the guest-facing NOVA HOUSE luxury website running concurrently on {publicUrl}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Device viewport toggle */}
          <div className="flex items-center border border-[#ECE8E0] bg-[#FAF8F5] rounded-xs p-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                device === 'desktop' ? 'bg-[#111111] text-white' : 'text-[#77736C] hover:text-[#111111]'
              }`}
              title="Desktop View (Full)"
            >
              <Monitor size={14} />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                device === 'tablet' ? 'bg-[#111111] text-white' : 'text-[#77736C] hover:text-[#111111]'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet size={14} />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                device === 'mobile' ? 'bg-[#111111] text-white' : 'text-[#77736C] hover:text-[#111111]'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button
            onClick={reloadIframe}
            className="p-2 border border-[#ECE8E0] bg-[#FAF8F5] hover:bg-[#F4F1EB] rounded-xs text-[#55514B] cursor-pointer"
            title="Reload Preview"
          >
            <RefreshCw size={14} />
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] hover:bg-[#222222] text-[#F4F1EB] text-xs font-mono font-medium rounded-xs transition-colors shadow-xs"
          >
            <span>Launch Live Website</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center bg-[#E5E0D8] p-4 sm:p-6 rounded-xs border border-[#CDC7BC]">
        <div className={`transition-all duration-300 ${getContainerWidth()} h-[720px] bg-white rounded-xs shadow-2xl overflow-hidden border border-[#111111]/20 flex flex-col`}>
          {/* Mock Browser Header */}
          <div className="bg-[#111111] px-4 py-2 flex items-center justify-between text-xs font-mono text-[#F4F1EB]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E05252]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-[11px] text-[#A58A5C] truncate">novahouse.com</span>
            </div>
            <span className="text-[10px] text-[#77736C] uppercase font-bold">
              {device.toUpperCase()} MODE
            </span>
          </div>

          {/* Iframe */}
          <iframe
            key={key}
            src={publicUrl}
            title="NOVA HOUSE Public Website Live Preview"
            className="w-full flex-1 border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
