import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Mic, Monitor, BarChart3, ArrowRight, Shield, Zap, Target } from 'lucide-react';
import { publicService } from '../services/api';

const LandingPage = () => {
  const [stats, setStats] = useState([
    { label: "Active Users", val: "..." },
    { label: "Interviews Analyzed", val: "..." },
    { label: "Success Rate", val: "..." },
    { label: "Partner Network", val: "..." }
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicService.getStats();
        const data = res.data;
        setStats([
          { label: "Active Users", val: data.activeUsers.toString() },
          { label: "Interviews Analyzed", val: data.interviewsAnalyzed.toString() },
          { label: "Success Rate", val: `${data.successRate}%` },
          { label: "Partner Network", val: `${data.partners}+` }
        ]);
      } catch (err) {
        console.error('Failed to fetch global stats:', err);
      }
    };
    fetchStats();
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center space-y-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/10"
        >
          <Zap size={14} fill="currentColor" /> The Future of Interview Prep
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6 max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[1.1]">
            Master your <span className="text-gradient">Potential</span> with AI.
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Personalized mock interviews, real-time feedback, and behavioral analysis. 
            Built for developers who want to stand out.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6"
        >
          <Link
            to="/interview"
            className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all duration-300 shadow-2xl shadow-blue-500/30 hover:scale-105"
          >
            Start Practicing Free <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-4 glass hover:bg-white/5 rounded-2xl font-bold text-lg transition-all duration-300 border-slate-700"
          >
            View Features
          </button>
        </motion.div>

        {/* Floating Hero Image Placeholder / Visual */}
        <Link to="/dashboard" className="w-full max-w-5xl block group">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative aspect-[21/9] glass-card rounded-[2.5rem] overflow-hidden border-white/5 p-2 group-hover:border-blue-500/30 transition-all duration-500"
          >
            <div className="w-full h-full bg-slate-900/50 rounded-[2.2rem] flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
              {/* Background Decorative Mesh for the box */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 animate-pulse" />
              
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 text-slate-300 font-bold">
                  <div className="relative">
                    <Bot size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-2xl font-black italic uppercase tracking-tighter">Live Candidate <span className="text-blue-400">Workspace</span></span>
                    <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-black flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> System Status: Operational
                    </span>
                  </div>
                </div>

                <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                  Launch Personal Analytics Panel
                </div>
              </div>
            </div>
            {/* Decorative Glowing Corner */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[60px] rounded-full group-hover:bg-blue-500/40 transition-all" />
          </motion.div>
        </Link>
      </section>

      {/* Features Grid */}
      <motion.section 
        id="features"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {[
          { icon: <Mic className="text-blue-400" />, title: "Whisper Speech-to-Text", desc: "Crystal clear transcriptions with 99% accuracy via OpenAI Whisper.", path: "/interview" },
          { icon: <Target className="text-emerald-400" />, title: "Technical Precision", desc: "GPT-4o analyzes your code explanations and system design logic.", path: "/interview" },
          { icon: <Monitor className="text-purple-400" />, title: "Confidence AI", desc: "Behavioral tracking for eye contact, posture, and nervous tics.", path: "/interview" },
          { icon: <Shield className="text-orange-400" />, title: "Secure & Private", desc: "Your data is encrypted and used only for your personalized growth.", path: "/dashboard" },
          { icon: <Zap className="text-yellow-400" />, title: "Real-time Metrics", desc: "Instant feedback on speaking speed, pitch, and filler words.", path: "/interview" },
          { icon: <BarChart3 className="text-pink-400" />, title: "Visual Progress", desc: "Beautifully choreographed charts tracking your 30-day growth.", path: "/dashboard" }
        ].map((feature, idx) => (
          <Link to={feature.path} key={idx}>
            <motion.div
              variants={itemVariants}
              className="group glass-card p-10 rounded-[2.5rem] h-full space-y-6 hover:border-blue-500/30 hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-[10deg] shadow-lg">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light">{feature.desc}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.section>

      {/* Stats/Social Proof Section */}
      <section className="glass rounded-[3rem] p-16 flex flex-wrap justify-center gap-20 text-center border-white/5">
        {stats.map((stat, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="text-5xl font-black tracking-tighter text-blue-400">{stat.val}</h4>
            <p className="text-slate-500 uppercase tracking-widest text-xs font-bold">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Footer-ish CTA */}
      <section className="pb-32 text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-black">Ready to <span className="text-gradient">level up</span>?</h2>
        <Link
          to="/interview"
          className="inline-flex px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl hover:scale-105 hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-2xl"
        >
          Launch Interview Room
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
