import { ExternalLink, Download } from 'lucide-react';

interface PersonalityDetailProps {
  data: {
    type: string;
    name: string;
    description: string;
    completedAt: string;
    traits?: Record<string, number>;
    pdfUrl?: string;
    pdfName?: string;
  };
}

export function PersonalityDetail({ data }: PersonalityDetailProps) {
  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Personality Profile</h2>
      
      <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-indigo-500/30">
        {data.pdfUrl ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Test Results</h3>
            </div>
            
            <div className="bg-black/60 rounded-lg p-4 border border-white/20 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium">{data.pdfName || '16 Personalities Test Results.pdf'}</div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={data.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </a>
                  <a 
                    href={data.pdfUrl} 
                    download
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Personality Type: {data.type}</h3>
              <span className="text-white/80">{data.name}</span>
            </div>
            
            <a 
              href={`https://www.16personalities.com/${data.type.toLowerCase()}-personality`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors inline-block"
            >
              <ExternalLink className="w-4 h-4" />
              Learn More
            </a>
          </div>
        )}
      </div>
    </div>
  );
}