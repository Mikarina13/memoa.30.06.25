import { ExternalLink, Download, FileText } from 'lucide-react';

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
  // Get color theme based on personality type
  const getTypeColor = () => {
    const type = data.type.substring(0, 2).toUpperCase();
    
    switch(type) {
      case 'IN': return 'from-purple-500 to-indigo-600';
      case 'EN': return 'from-blue-500 to-indigo-600';
      case 'IS': return 'from-yellow-500 to-amber-600';
      case 'ES': return 'from-orange-500 to-red-600';
      default: return 'from-indigo-500 to-purple-600';
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Personality Profile</h2>
      
      <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg border border-indigo-500/30">
        {data.pdfUrl ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Test Results</h3>
            </div>
            
            <div className="mb-6">
              {/* Personality Type Display */}
              <div className={`bg-gradient-to-r ${getTypeColor()} p-4 rounded-lg text-white mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl font-bold">{data.type}</div>
                  <div className="font-medium">{data.name}</div>
                </div>
                <p className="text-white/90">{data.description}</p>
              </div>
            </div>
            
            <div className="bg-black/60 rounded-lg p-4 border border-white/20 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-indigo-400" />
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
            
            <div className={`bg-gradient-to-r ${getTypeColor()} p-4 rounded-lg text-white mb-4`}>
              <p className="text-white/90">{data.description}</p>
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

      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">About Personality Types</h3>
        <p className="text-white/70 mb-4">
          The 16 personality types are based on the Myers-Briggs Type Indicator (MBTI), which categorizes people according to four psychological functions:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-400 mb-2">Extroversion (E) vs Introversion (I)</h4>
            <p className="text-white/70 text-sm">How a person directs their energy and attention</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-400 mb-2">Sensing (S) vs Intuition (N)</h4>
            <p className="text-white/70 text-sm">How a person takes in information from the world</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-400 mb-2">Thinking (T) vs Feeling (F)</h4>
            <p className="text-white/70 text-sm">How a person makes decisions</p>
          </div>
          
          <div className="bg-white/5 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-400 mb-2">Judging (J) vs Perceiving (P)</h4>
            <p className="text-white/70 text-sm">How a person approaches structure and planning</p>
          </div>
        </div>
      </div>
    </div>
  );
}