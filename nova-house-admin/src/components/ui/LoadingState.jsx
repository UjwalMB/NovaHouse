import React from 'react';

export default function LoadingState({ message = 'Loading details...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-9 h-9 border-2 border-[#E2DDD5] border-t-[#A58A5C] rounded-full animate-spin mb-4" />
      <p className="font-mono text-xs uppercase tracking-widest text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
