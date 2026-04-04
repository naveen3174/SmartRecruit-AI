import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { Loader2, CheckCircle2, AlertCircle, FileText, Share2, ArrowLeft, Download, Zap, Send } from 'lucide-react';
import { interviewService, publicService } from '../services/api';
import AnalyticsCharts from '../components/AnalyticsCharts';

const ResultsPage = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [shared, setShared] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await interviewService.askCoach(id, userMsg);
      setChatHistory(prev => [...prev, { role: 'coach', content: res.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { role: 'coach', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    const doc = new jsPDF();
    const { analysis } = result;
    const margin = 20;
    let y = 30;

    // Background Styling (Simple Header Bar)
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');

    // Header Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartRecruit AI - Interview Report', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`SESSION ID: #${id.slice(-6).toUpperCase()}`, margin, 35);
    doc.text(`DATE: ${new Date(result.createdAt).toLocaleDateString()}`, 150, 35);

    y = 60;
    doc.setTextColor(0, 0, 0);

    // Section: Performance Summary
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Performance Breakdown', margin, y);
    y += 12;

    const scores = [
      { label: 'Overall Competency', val: `${analysis?.overallScore || 0}%` },
      { label: 'Communication clarity', val: `${analysis?.communicationScore || 0}%` },
      { label: 'Technical depth', val: `${analysis?.technicalScore || 0}%` },
      { label: 'Confidence level', val: `${analysis?.confidenceScore || 0}%` }
    ];

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    scores.forEach(s => {
      doc.text(`${s.label}:`, margin + 5, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(s.val), 80, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Behavioral Vibe:', margin + 5, y);
    doc.setFont('helvetica', 'italic');
    doc.text(analysis?.sentiment || 'Professional & Focused', 60, y);
    y += 15;

    // Section: AI Recommendation
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('2. AI Verdict & Summary', margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const splitSummary = doc.splitTextToSize(`"${analysis?.summaryRecommendation || "The candidate shows balanced skills but requires deeper technical drill-down for high-seniority roles."}"`, 170);
    doc.text(splitSummary, margin + 5, y);
    y += (splitSummary.length * 5) + 15;

    // Section: Strengths
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('3. Key Strengths', margin, y);
    y += 10;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    (analysis?.strengths || []).forEach(s => {
      const splitText = doc.splitTextToSize(`• ${s}`, 170);
      doc.text(splitText, margin + 5, y);
      y += splitText.length * 6;
    });
    y += 10;

    // Section: HR Playbook
    if (y > 220) { doc.addPage(); y = 30; }
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // Blue
    doc.text("4. Coach's Playbook (HR Tips)", margin, y);
    y += 10;
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    (analysis?.hrTips || ["Maintain STAR format", "Elaborate more on architecture"]).forEach(tip => {
      const splitTip = doc.splitTextToSize(`• ${tip}`, 170);
      doc.text(splitTip, margin + 5, y);
      y += splitTip.length * 6;
    });

    // Transcript if space permits or on new page
    if (y > 180) { doc.addPage(); y = 30; } else { y += 20; }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Transcript Preview', margin, y);
    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const splitTranscript = doc.splitTextToSize((result.transcript || "").substring(0, 1000) + ((result.transcript || "").length > 1000 ? "..." : ""), 170);
    doc.text(splitTranscript, margin + 5, y);

    try {
      doc.save(`Performance_Report_${id.slice(-6)}.pdf`);
    } catch (err) {
      console.error('PDF Save error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Try fetching with auth first
        const token = localStorage.getItem('token');
        let response;
        if (token) {
          try {
            response = await interviewService.getResults(id);
          } catch (e) {
            // If private fetch fails (maybe not the owner), try public
            response = await publicService.getPublicResults(id);
          }
        } else {
          // No token, try public endpoint directly
          response = await publicService.getPublicResults(id);
        }

        setResult(response.data);
        if (response.data.status === 'processing') {
          setTimeout(fetchResults, 3000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black tracking-tight">AI Analysis in <span className="text-blue-500 italic">Progress</span></h2>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-xs">Decoding speech patterns & technical depth...</p>
        </div>
      </div>
    );
  }

  if (!result || result.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6 text-center">
        <div className="p-6 bg-red-500/10 rounded-[2.5rem] border border-red-500/20">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-black tracking-tight">Analysis <span className="text-red-500">Failed</span></h2>
        <p className="text-slate-400 max-w-md font-medium">Something went wrong while processing your interview. Please check your connection or try again.</p>
        <Link to="/interview" className="px-8 py-3 glass hover:bg-white/5 rounded-2xl font-bold">Try Again</Link>
      </div>
    );
  }

  const analysis = result?.analysis || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-16 pb-32"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          {localStorage.getItem('token') ? (
            <Link to="/dashboard" className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          ) : (
            <Link to="/" className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 hover:text-white transition-colors flex items-center gap-2">
              <Zap size={14} /> Get Your Own AI Analysis
            </Link>
          )}
          <h1 className="text-5xl font-black tracking-tight">Performance <span className="text-gradient">Report</span></h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400 border-blue-500/20">Session ID: #{id.slice(-6)}</span>
            <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              {new Date(result.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleShare}
            className="px-6 py-3 glass hover:bg-white/5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all border-white/5"
          >
            {shared ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Share2 size={18} />}
            {shared ? 'Link Copied!' : 'Share Results'}
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-8 py-3 bg-white text-slate-950 hover:bg-blue-500 hover:text-white rounded-2xl text-sm font-black flex items-center gap-2 transition-all shadow-2xl disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {exporting ? 'Generating...' : 'Export Full PDF'}
          </button>
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: 'Overall Score', val: analysis?.overallScore || 0, color: 'text-blue-400', glow: 'bg-blue-500/10' },
          { label: 'Communication', val: analysis?.communicationScore || 0, color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
          { label: 'Technical Score', val: analysis?.technicalScore || 0, color: 'text-purple-400', glow: 'bg-purple-500/10' },
          { label: 'Confidence', val: analysis?.confidenceScore || 0, color: 'text-orange-400', glow: 'bg-orange-500/10' },
          { label: 'Job Match', val: analysis?.jobMatchScore || 0, color: 'text-pink-400', glow: 'bg-pink-500/10' }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ scale: 1.02 }}
            className={`glass-card p-8 rounded-[2rem] relative overflow-hidden group`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.glow} blur-[40px] rounded-full group-hover:opacity-100 transition-opacity opacity-50`} />
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">{stat.label}</p>
            <p className={`text-5xl font-black ${stat.color} tracking-tighter`}>{stat.val}%</p>
          </motion.div>
        ))}
      </div>

      {/* Summary & Behavior Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-10 rounded-[2.5rem] border-white/5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500">AI Summary Verdict</h3>
          <p className="text-2xl font-bold leading-tight italic">"{analysis?.summaryRecommendation || "The candidate shows good potential with specific areas for technical growth."}"</p>
        </div>
        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Behavioral Vibe</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sentiment</span>
              <span className="font-black text-white">{analysis?.sentiment || "Professional"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(analysis?.emotions || ["Confident", "Curious"]).map((e, i) => (
                <span key={i} className="px-3 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-black rounded-full uppercase tracking-tighter border border-orange-500/20">{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question Breakdown Section */}
      {result.questions && result.questions.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black tracking-tight uppercase italic">Question Breakdown</h2>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.questions.map((q, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-[2rem] border-white/5 space-y-4 relative overflow-hidden group"
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Q{i+1}</span>
                  {q.wasAnswered ? (
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold rounded-full uppercase border border-emerald-500/20 shadow-lg shadow-emerald-500/5">Answered</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 text-[8px] font-bold rounded-full uppercase border border-red-500/20">Skipped/Unclear</span>
                  )}
                </div>
                <p className="text-lg font-bold leading-tight group-hover:text-blue-400 transition-colors">{q.questionText}</p>
                {q.wasAnswered && q.answerText && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">AI Summary of Response</p>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed italic">"{q.answerText}"</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Visual Analytics */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Visual insights</h2>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>
        <AnalyticsCharts data={analysis} />
      </section>

      {/* HR Tips Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="glass-card p-12 rounded-[3rem] border-blue-500/20 bg-blue-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="flex items-center gap-6 mb-10">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
            <Zap className="text-white" size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase italic italic tracking-tight text-white">Coach's Playbook</h3>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none">Strategic HR Guidance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(analysis.hrTips || [
            "Structure your technical answers using the STAR method.",
            "Try to mention more specific libraries when discussing React."
          ]).map((tip, i) => (
            <div key={i} className="flex gap-4 group">
              <span className="text-3xl font-black text-blue-500/20 group-hover:text-blue-500 transition-colors">0{i+1}</span>
              <p className="text-slate-300 font-medium leading-relaxed pt-2">{tip}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Qualititative Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 rounded-[2.5rem] space-y-8 border-white/5"
        >
          <h3 className="text-2xl font-black flex items-center gap-4 italic uppercase">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><CheckCircle2 className="text-emerald-500" /></div>
            Top Strengths
          </h3>
          <ul className="space-y-6">
            {(analysis?.strengths || []).map((s, i) => (
              <li key={i} className="flex gap-4 items-start text-slate-300 font-medium group">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 group-hover:scale-150 transition-transform shadow-lg shadow-emerald-500/50" />
                <p className="leading-relaxed">{s}</p>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 rounded-[2.5rem] space-y-8 border-white/5"
        >
          <h3 className="text-2xl font-black flex items-center gap-4 italic uppercase">
            <div className="p-3 bg-amber-500/10 rounded-2xl"><AlertCircle className="text-amber-500" /></div>
            Delta Points
          </h3>
          <ul className="space-y-6">
            {(analysis?.weaknesses || []).map((w, i) => (
              <li key={i} className="flex gap-4 items-start text-slate-300 font-medium group">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 group-hover:scale-150 transition-transform shadow-lg shadow-amber-500/50" />
                <p className="leading-relaxed">{w}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Raw Transcript */}
      <section className="glass-card p-10 rounded-[2.5rem] space-y-6 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <FileText size={160} />
        </div>
        <h3 className="text-2xl font-black uppercase italic">AI Transcription <span className="text-slate-600 font-normal">/ Verified</span></h3>
        <p className="text-xl font-medium text-slate-400 leading-loose italic max-w-5xl">
          "{result.transcript}"
        </p>
      </section>

      {/* AI Coach Follow-up Chat */}
      <section className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase italic tracking-tight text-blue-400">Consult the AI Coach</h2>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>
        <div className="glass-card p-10 rounded-[3rem] border-white/5 space-y-8 max-w-4xl mx-auto">
          {/* Chat History */}
          <div className="space-y-6 max-h-[400px] overflow-y-auto px-4 py-2 scrollbar-hide">
            {chatHistory.length === 0 && (
              <p className="text-center text-slate-500 font-medium italic">Ask me anything about your performance or how to improve specific answers.</p>
            )}
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-5 rounded-2xl ${chat.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'glass border-white/10 text-slate-300 rounded-tl-none'}`}>
                  <p className="text-sm font-medium leading-relaxed">{chat.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="glass p-5 rounded-2xl animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="relative">
            <input 
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-5 px-6 pr-16 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
            />
            <button 
              type="submit"
              disabled={chatLoading || !chatMessage.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </section>
    </motion.div>
  );
};

export default ResultsPage;
