import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { interviewService } from '../services/api';

const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await interviewService.getHistory();
        setSessions(res.data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getSortedSessions = () => {
    let result = [...sessions].filter(session => 
      session.jobDescription.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'newest': return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest': return result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highest': return result.sort((a, b) => (b.analysis?.overallScore || 0) - (a.analysis?.overallScore || 0));
      case 'lowest': return result.sort((a, b) => (a.analysis?.overallScore || 0) - (b.analysis?.overallScore || 0));
      default: return result;
    }
  };

  const filteredSessions = getSortedSessions();

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-12 pb-32"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <History size={20} />
            <span className="text-xs font-black uppercase tracking-[0.4em]">Archive</span>
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">
            Session <span className="text-gradient">History</span>
          </h1>
          <p className="text-slate-500 font-medium">Explore and review all your past AI-driven performance reports.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto relative">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search by job role..."
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-2xl transition-all border ${showFilters ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'}`}
            >
              <Filter size={18} />
            </button>
            
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-3 w-56 glass-card border-white/10 rounded-2xl p-2 z-50 shadow-2xl backdrop-blur-xl"
              >
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 mb-1">
                  Sort Results By
                </div>
                {[
                  { id: 'newest', label: 'Newest First', icon: <ArrowUpDown size={14} /> },
                  { id: 'oldest', label: 'Oldest First', icon: <ArrowUpDown size={14} /> },
                  { id: 'highest', label: 'Highest Score', icon: <ArrowUpDown size={14} /> },
                  { id: 'lowest', label: 'Lowest Score', icon: <ArrowUpDown size={14} /> },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setShowFilters(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${sortBy === option.id ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {option.label}
                    {sortBy === option.id && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {filteredSessions.length === 0 ? (
        <div className="glass-card rounded-[3rem] p-20 text-center border-white/5">
          <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
            <History size={32} className="text-slate-600" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No matching sessions</h3>
          <p className="text-slate-500 mb-8">Try adjusting your search query or start a new session.</p>
          <Link 
            to="/interview"
            className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold hover:scale-105 transition-transform inline-block"
          >
            Start New Mock
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSessions.map((session, index) => (
            <motion.div
              key={session._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' }}
              className="glass-card group rounded-[2.5rem] border-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-8 w-full md:w-auto">
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shrink-0">
                  <span className="text-2xl font-black text-blue-500">{index + 1}</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors line-clamp-1">
                    {session.jobDescription}
                  </h3>
                  <div className="flex items-center gap-4 text-slate-500 text-xs font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(session.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Performance</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${session.analysis?.overallScore || 0}%` }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                      />
                    </div>
                    <span className="text-lg font-black text-white">{session.analysis?.overallScore || 0}%</span>
                  </div>
                </div>

                <Link 
                  to={`/results/${session._id}`}
                  className="w-14 h-14 bg-white text-slate-950 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl"
                >
                  <ChevronRight />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
