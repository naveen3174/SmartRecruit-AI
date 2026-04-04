import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, History, TrendingUp, Award, Clock, ArrowRight, Loader2, BarChart2, FileText, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { interviewService } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState([
    { label: 'Mock Sessions', value: '0', icon: <History className="text-blue-400" />, color: 'blue' },
    { label: 'Technical Peak', value: '0%', icon: <Award className="text-emerald-400" />, color: 'emerald' },
    { label: 'Comm. Growth', value: 'Stable', icon: <TrendingUp className="text-purple-400" />, color: 'purple' },
  ]);
  const [resumeStatus, setResumeStatus] = useState({ hasResume: false, loading: true });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchHistory = async () => {
    try {
      const res = await interviewService.getHistory();
      const statusRes = await interviewService.getResumeStatus();
      setResumeStatus({ ...statusRes.data, loading: false });
      const data = res.data;
      setSessions(data);

      // Calculate Stats
      const sessionsCount = data.length;
      const recentScores = data.slice(0, 5).map(s => s.analysis?.overallScore || 0);
      const peakScore = Math.max(...(data.map(s => s.analysis?.overallScore || 0).concat(0)));
      const avgScore = Math.round(data.reduce((acc, s) => acc + (s.analysis?.overallScore || 0), 0) / (sessionsCount || 1));
      
      setStats([
        { label: 'Total Sessions', value: sessionsCount.toString(), icon: <History className="text-blue-400" />, color: 'blue' },
        { label: 'Technical Peak', value: `${peakScore}%`, icon: <Award className="text-emerald-400" />, color: 'emerald' },
        { label: 'Global Average', value: `${avgScore}%`, icon: <BarChart2 className="text-purple-400" />, color: 'purple' },
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeStatus(prev => ({ ...prev, loading: true }));
    const formData = new FormData();
    formData.append('resume', file);

    try {
      await interviewService.uploadResume(formData);
      alert('Resume synced with AI profile!');
      fetchHistory();
    } catch (err) {
      alert('Failed to upload resume.');
      setResumeStatus(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-16 pb-32"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tight leading-none italic uppercase">
            {user.name?.split(' ')[0]}'s <span className="text-gradient">Workspace</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-wide max-w-md">
            Welcome back, {user.name || 'Candidate'}. Your AI performance analysis is synchronized.
          </p>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer group flex items-center gap-3 px-6 py-4 glass border-white/5 hover:bg-white/5 rounded-[2rem] transition-all">
            <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
            {resumeStatus.loading ? <Loader2 size={18} className="animate-spin" /> : 
             resumeStatus.hasResume ? <Check size={18} className="text-emerald-500" /> : <FileText size={18} className="text-blue-400" />}
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-wider">{resumeStatus.hasResume ? 'Resume Synced' : 'Sync Resume'}</span>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{resumeStatus.hasResume ? 'AI Profile Active' : 'Match JD to Skills'}</span>
            </div>
          </label>
          <Link 
            to="/interview"
            className="group px-8 py-4 bg-white text-slate-950 hover:bg-blue-600 hover:text-white rounded-[2rem] font-black text-lg flex items-center gap-3 transition-all duration-300 shadow-2xl hover:scale-105"
          >
            New Session <Play size={18} fill="currentColor" />
          </Link>
        </div>
      </header>

      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.05 }}
            className="glass-card p-10 rounded-[2.5rem] relative overflow-hidden group border-white/5"
          >
            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${stat.color}-500/10 blur-[50px] rounded-full group-hover:bg-${stat.color}-500/20 transition-all`} />
            <div className="flex flex-col gap-6">
              <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                {stat.icon}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500">{stat.label}</p>
                <p className="text-5xl font-black tracking-tighter">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Performance Chart */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase italic tracking-tight">Growth Analytics</h2>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>
        <div className="glass-card p-10 rounded-[3rem] border-white/5 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...sessions].reverse().map(s => ({ date: new Date(s.createdAt).toLocaleDateString(), score: s.analysis?.overallScore || 0 }))}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Activity Timeline / History */}
      <section className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black uppercase italic tracking-tight">Recent Sessions</h2>
          <Link 
            to="/history"
            className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 hover:translate-x-1 transition-transform"
          >
            See all logs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="glass-card rounded-[3rem] overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">
                No sessions yet. Start your first mock interview!
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
                  <tr>
                    <th className="px-10 py-6">Job Specification</th>
                    <th className="px-10 py-6">Success Rate</th>
                    <th className="px-10 py-6">Time-stamped</th>
                    <th className="px-10 py-6 text-right">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sessions.slice(0, 5).map((item) => (
                    <motion.tr 
                      key={item._id} 
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      className="group cursor-pointer transition-colors"
                    >
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-lg font-bold group-hover:text-blue-400 transition-colors line-clamp-1">{item.jobDescription}</span>
                          <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Enterprise Context</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.analysis?.overallScore || 0}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500"
                            />
                          </div>
                          <span className="text-sm font-black text-blue-400">{item.analysis?.overallScore || 0}%</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                          <Clock size={14} className="text-slate-600" />
                          <span className="text-sm whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right text-slate-400">
                        <Link 
                          to={`/results/${item._id}`} 
                          className="px-5 py-2 glass hover:bg-white text-slate-500 hover:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          Launch Report
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
};



export default Dashboard;
