import { useState, useEffect } from 'react';
import { Vehicle } from '../App';
import { DiagnosticHistory, getHistory } from '../lib/history';
import { History as HistoryIcon, CarFront, FileText, Calendar, Camera, Wrench, ChevronRight, Printer, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface HistoryTabProps {
  onSelectVehicle: (vehicle: Vehicle) => void;
  onNavigate: () => void;
}

export default function HistoryTab({ onSelectVehicle, onNavigate }: HistoryTabProps) {
  const [history, setHistory] = useState<DiagnosticHistory[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiagnosticHistory | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSelectEntry = (entry: DiagnosticHistory) => {
    setSelectedEntry(entry);
  };

  const handleBack = () => {
    setSelectedEntry(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <AnimatePresence mode="wait">
        {!selectedEntry ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B] print:hidden"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-[#334155] pb-4">
              <div className="bg-[#1E293B] p-2.5 rounded-full text-[#94A3B8]">
                <HistoryIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#F59E0B]">Repair History</h2>
                <p className="text-sm text-[#94A3B8]">Review past diagnostic sessions and vehicle logs.</p>
              </div>
            </div>

            {history.length > 0 ? (
              <div className="space-y-8">
                {Array.from(new Set(history.map(e => `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}`))).map(vehicleTitle => {
                  const vehicleEntries = history.filter(e => `${e.vehicle.year} ${e.vehicle.make} ${e.vehicle.model}` === vehicleTitle);
                  
                  return (
                    <div key={vehicleTitle} className="space-y-3">
                      <h3 className="text-[#E2E8F0] font-bold border-b border-[#334155] pb-2 flex items-center gap-2">
                        <CarFront className="w-4 h-4 text-[#F59E0B]" />
                        {vehicleTitle}
                      </h3>
                      {vehicleEntries.map(entry => (
                        <button
                          key={entry.id}
                          onClick={() => handleSelectEntry(entry)}
                          className="w-full text-left bg-[#1A202C] hover:bg-[#1E293B] border border-[#334155] p-4 rounded-xl transition-colors group flex items-center justify-between"
                        >
                          <div className="flex items-start gap-4">
                            <div className="bg-[#0F1115] p-2 rounded-lg text-[#64748B] group-hover:text-[#FCD34D] transition-colors border border-[#334155]">
                              {entry.type === 'diagnostic' ? <Wrench className="w-5 h-5" /> : entry.type === 'obd2' ? <Gauge className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-[#E2E8F0] font-semibold text-sm">
                                {entry.type === 'diagnostic' ? 'Guided Diagnostic' : entry.type === 'obd2' ? 'OBD-II Diagnostician' : 'Part Scanner'}
                              </p>
                              <p className="text-[#94A3B8] text-sm line-clamp-1 max-w-[200px] sm:max-w-[400px] mt-0.5 italic">
                                "{entry.query}"
                              </p>
                              <p className="text-[#64748B] text-xs flex items-center gap-1 mt-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(entry.date)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#64748B] group-hover:text-[#FCD34D] transition-colors" />
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 opacity-70">
                <FileText className="w-12 h-12 text-[#334155] mx-auto mb-3" />
                <p className="text-[#94A3B8]">No repair history found.</p>
                <p className="text-[#64748B] text-sm mt-1">Diagnostic sessions will appear here once saved.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
             <button
              onClick={handleBack}
              className="print:hidden flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm font-semibold mb-2"
            >
              <div className="bg-[#1E293B] p-1.5 rounded-md">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              Back to History
            </button>

            <div className="bg-[#151921] p-6 rounded-2xl shadow-xl border border-[#1E293B] print:shadow-none print:border-none print:bg-transparent print:p-0">
              <div className="flex items-start justify-between border-b border-[#334155] pb-4 mb-6 print:border-black">
                <div>
                  <h2 className="text-lg font-bold text-[#FCD34D] flex items-center gap-2">
                    <CarFront className="w-5 h-5" />
                    {selectedEntry.vehicle.year} {selectedEntry.vehicle.make} {selectedEntry.vehicle.model}{selectedEntry.vehicle.engine ? ` ${selectedEntry.vehicle.engine}` : ''}
                  </h2>
                  <p className="text-[#94A3B8] text-sm mt-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedEntry.date)}
                  </p>
                </div>
                <div className="bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155] text-xs font-semibold text-[#E2E8F0] tracking-wider uppercase">
                  {selectedEntry.type === 'diagnostic' ? 'Guided Diagnostic' : selectedEntry.type === 'obd2' ? 'OBD-II Lookup' : 'Vision Scan'}
                </div>
              </div>

              <div className="bg-[#0F1115] border border-[#1E293B] p-4 rounded-xl mb-6 print:border-gray-300 print:bg-white">
                 <p className="text-xs text-[#64748B] print:text-gray-500 font-bold uppercase tracking-wider mb-2">Original Query</p>
                 <p className="text-[#E2E8F0] print:text-black text-sm italic">"{selectedEntry.query}"</p>
              </div>

              <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-li:my-1 prose-headings:text-[#FCD34D] text-[#E2E8F0] print:prose-p:text-black print:prose-li:text-black print:prose-headings:text-black">
                <ReactMarkdown>{selectedEntry.result}</ReactMarkdown>
              </div>

              {Array.isArray(selectedEntry.queries) && selectedEntry.queries.length > 0 && (
                <div className="print:hidden mt-8 pt-6 border-t border-[#334155]">
                  <h4 className="font-bold text-[#FCD34D] mb-3 flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4" /> Recommended Tutorials
                  </h4>
                  <div className="space-y-3">
                    {selectedEntry.queries.map((query, index) => (
                      <a
                        key={index}
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-[#1A202C] hover:bg-[#1E293B] border border-[#334155] p-3 rounded-lg transition-colors group"
                      >
                        <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded flex items-center justify-center shrink-0">
                          <HistoryIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#E2E8F0] group-hover:text-white transition-colors">{query}</p>
                          <p className="text-xs text-[#64748B]">Search on YouTube</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="print:hidden mt-8 pt-6 border-t border-[#334155] flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    onSelectVehicle(selectedEntry.vehicle);
                    onNavigate();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-xl transition-all border border-[#475569]"
                >
                  Start New Session for This Vehicle
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-xl transition-all border border-[#475569]"
                >
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
