import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Loader2, Send, Mic, Radio, Video, Target, Volume2, CirclePause, CirclePlay } from 'lucide-react';
import { interviewService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const InterviewRoom = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const navigate = useNavigate();
  const speechRef = useRef(null);
  const lastSpokenRef = useRef(-1); // To prevent double speaking the same question

  const speakQuestion = useCallback((text) => {
    if (!text) return;
    
    // Always cancel before starting new
    window.speechSynthesis.cancel();
    setIsPaused(false);
    setIsSpeaking(false);
    
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0; 
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      
      // Better voice selection for Mobile & Desktop
      const preferredVoice = voices.sort((a, b) => {
        const score = (v) => {
          let s = 0;
          const name = v.name.toLowerCase();
          const lang = v.lang.toLowerCase();
          
          // Strict language match (Highest priority)
          if (lang.includes('en-us') || lang.includes('en-gb')) s += 10000;
          else if (lang.startsWith('en')) s += 5000;
          else s -= 10000; // Penalize non-English heavily for English text

          // Quality markers
          if (name.includes('natural') || name.includes('neural') || name.includes('online')) s += 3000;
          
          // Elite voices
          const elite = ['aria', 'jenny', 'amy', 'emma', 'samantha', 'ava', 'sonia', 'joanna', 'karen'];
          if (elite.some(ev => name.includes(ev))) s += 2000;
          
          if (name.includes('google')) s += 1000;
          if (name.includes('female')) s += 500;
          
          // Echo/Robotic penalties
          if (name.includes('desktop') || name.includes('zira') || name.includes('david')) s -= 8000;
          
          return s;
        };
        return score(b) - score(a);
      })[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = 'en-US'; // Hard fallback
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = (e) => {
        console.error("Speech error:", e);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
      speechRef.current = utterance;
    };

    // Mobile voice loading fix
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speak();
      };
    } else {
      setTimeout(speak, 50);
    }
  }, []);

  const toggleSpeech = useCallback(() => {
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        
        // Bug fix for Mobile (Chrome/Safari): if resume() fails, force restart
        setTimeout(() => {
          if (window.speechSynthesis.paused && isSpeaking) {
            console.log("[Speech] Resume failed, force restarting...");
            window.speechSynthesis.cancel();
            speakQuestion(questions[currentQuestionIdx]);
          }
        }, 150);
      } else if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } catch (err) {
      console.error("Speech toggle error:", err);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [questions, currentQuestionIdx, isSpeaking, speakQuestion]);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  React.useEffect(() => {
    // Only speak if questions exist AND this question hasn't been spoken yet
    if (questions.length > 0 && lastSpokenRef.current !== currentQuestionIdx) {
      lastSpokenRef.current = currentQuestionIdx; // Mark as spoken
      speakQuestion(questions[currentQuestionIdx]);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentQuestionIdx, questions, speakQuestion]);

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const response = await interviewService.generateQuestions(jobDescription);
      setQuestions(response.data.questions);
      setCurrentQuestionIdx(0);
      lastSpokenRef.current = -1; // Reset tracker for new questions
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to sync AI Coach. Please check if your server is running and your API key is valid.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const startRecording = useCallback(() => {
    setRecordedChunks([]);
    
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
      "video/quicktime"
    ];
    
    const mimeType = types.find(type => MediaRecorder.isTypeSupported(type)) || "";
    mimeTypeRef.current = mimeType;
    console.log("[Audio/Video] Using supported mimeType:", mimeType);

    try {
      if (!webcamRef.current || !webcamRef.current.stream) {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        if (!isSecure) {
          alert("Security Error: Mobile browsers block camera access on 'http' links. Please use a laptop or setup 'https'.");
        } else {
          alert("Camera not ready. Please ensure camera permissions are granted and try again.");
        }
        return;
      }

      setIsRecording(true);
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 120000,   // 120kbps - Balanced for 15-min sessions (stays under 20MB)
        audioBitsPerSecond: 32000    // 32kbps - Clear voice
      });
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start(10000); // 10 sec chunks
      console.log("[Audio/Video] Long Session (15m) Optimization Active.");
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      if (err.name === "SecurityError") {
        alert("Security Error: Camera access is blocked on insecure (HTTP) connections on mobile.");
      } else {
        alert("Recording error: " + err.message);
      }
      setIsRecording(false);
    }
  }, [webcamRef, setIsRecording, handleDataAvailable]);

  const mimeTypeRef = useRef("");

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        console.log("[Audio/Video] MediaRecorder stopped");
      }
    } catch (err) {
      console.error("Error stopping MediaRecorder:", err);
    } finally {
      setIsRecording(false);
    }
  }, [mediaRecorderRef, setIsRecording]);

  const handleAnalyze = async () => {
    if (recordedChunks.length === 0) {
      alert("No recording data found. Please record again.");
      return;
    }
    
    setIsAnalyzing(true);
    // Use the stored mimeType or fallback to webm
    const type = mimeTypeRef.current || "video/webm";
    const blob = new Blob(recordedChunks, { type: type });
    const extension = type.includes('mp4') ? 'mp4' : type.includes('quicktime') ? 'mov' : 'webm';
    const file = new File([blob], `interview.${extension}`, { type: type });
    
    const formData = new FormData();
    formData.append("video", file);
    formData.append("jobDescription", jobDescription);
    formData.append("questions", JSON.stringify(questions));
    
    try {
      const response = await interviewService.startAnalysis(formData);
      setTimeout(() => {
        navigate(`/results/${response.data.interviewId}`);
      }, 2000);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("AI Analysis failed: " + (error.response?.data?.error || error.message));
      setIsAnalyzing(false);
    }
  };

  const onUserMediaError = useCallback((err) => {
    console.error("Camera error:", err);
    alert("Camera/Mic Error: Please ensure you have granted permissions. Note: Mobile browsers often require HTTPS for camera access.");
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Side: Video Preview */}
        <div className="flex-1 space-y-6">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden glass-card p-2 border-white/5 bg-slate-900 group">
            <Webcam
              audio={true}
              muted={true} // Stop live mic feedback (Prevent echo/double voice)
              ref={webcamRef}
              videoConstraints={{
                width: 640, // Standard 480p - Good balance for AI processing
                height: 480,
                facingMode: "user"
              }}
              className="w-full h-full object-cover rounded-[2.2rem]"
              mirrored
              onUserMediaError={onUserMediaError}
            />
            {/* Status Overlays */}
            <div className="absolute top-8 left-8 flex items-center gap-3 px-4 py-2 glass rounded-full border-white/10">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white">
                {isRecording ? 'Live Recording' : 'Ready to Start'}
              </span>
            </div>
            
            <AnimatePresence>
              {!isRecording && questions.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="text-center space-y-2">
                    <Video size={48} className="mx-auto text-blue-400 opacity-50 mb-4" />
                    <p className="text-xl font-bold">Input Job Details to Begin</p>
                    <p className="text-sm text-slate-400">Your AI coach is waiting for context.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-6">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={questions.length === 0}
                className="group px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:scale-100 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all duration-300 shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95"
              >
                <Play size={24} fill="currentColor" /> Start Interview Session
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-10 py-4 bg-slate-800 hover:bg-red-600 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all duration-300 border border-white/10 shadow-2xl active:scale-95"
              >
                <Square size={24} fill="currentColor" /> Finish Recording
              </button>
            )}
            
            {recordedChunks.length > 0 && !isRecording && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all duration-300 shadow-2xl shadow-emerald-500/20 active:scale-95"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : "Unlock AI Insights"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Setup & Questions */}
        <div className="w-full lg:w-[450px] space-y-8">
          <div className="glass-card p-8 rounded-[2.5rem] space-y-8 border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-colors" />
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black italic tracking-tight uppercase">Session <span className="text-blue-500">Config</span></h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">Contextual Setup</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 flex items-center gap-2">
                  <Target size={14} /> Job Description & Requirements
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="E.g. Senior Frontend Engineer with React, Three.js, and WebGL experience..."
                  className="w-full h-40 bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700 leading-relaxed"
                />
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating || !jobDescription}
                className="w-full py-4 bg-slate-100 text-slate-950 hover:bg-blue-500 hover:text-white disabled:opacity-30 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <>Sync AI Coach <Send size={16} /></>}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-10 rounded-[2.5rem] space-y-8 border-blue-500/30 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
                  <Radio size={120} />
                </div>

                <div className="flex justify-between items-center text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 px-3 py-1 glass rounded-full border-blue-500/20">
                      <Mic size={10} className={isSpeaking ? "text-red-500 animate-pulse" : ""} /> 
                      {isSpeaking ? (isPaused ? "AI Paused" : "AI is Speaking...") : "Active Question"}
                    </span>
                    
                    <div className="flex items-center gap-1.5 glass rounded-full px-2 py-1 border-white/5">
                      <button 
                        onClick={() => speakQuestion(questions[currentQuestionIdx])}
                        className={`p-1.5 rounded-full transition-colors ${isSpeaking && !isPaused ? "bg-blue-600 text-white animate-bounce" : "hover:bg-blue-500/20 text-blue-400"}`}
                        title="Replay Question"
                      >
                        <Volume2 size={16} />
                      </button>

                      {isSpeaking && (
                        <>
                          <button 
                            onClick={toggleSpeech}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
                            title={isPaused ? "Resume" : "Pause"}
                          >
                            {isPaused ? <CirclePlay size={18} /> : <CirclePause size={18} />}
                          </button>
                          <button 
                            onClick={stopSpeech}
                            className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors text-red-500"
                            title="Stop"
                          >
                            <Square size={14} fill="currentColor" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <span>{currentQuestionIdx + 1} / {questions.length}</span>
                </div>
                
                <p className="text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                  "{questions[currentQuestionIdx]}"
                </p>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                    className="flex-1 py-3 hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest border border-white/5 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest border border-blue-500/20 transition-all"
                  >
                    Next Question
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
