import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, BookOpen, Volume2, VolumeX, Mic, MicOff, Eye, Sun, Moon, Type, Activity, Sparkles, FileText, LogOut, Paperclip, Loader2, Brain, Zap, Shield, Users, ChevronDown } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import AIAssistant from './components/AIAssistant';
import './styles/index.css';
import './styles/animations.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- Animated Orb Background ---
function OrbBackground() {
  return (
    <div className="orb-bg" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}

// --- Scroll Reveal Hook ---
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

// --- Animated Counter ---
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useScrollReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// --- Reveal Card ---
function RevealCard({ children, delay = 0, style = {} }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Summary extractor
function generateSummary(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 5).map(s => `• ${s.trim()}`).join('\n');
}

function App() {
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState('light');
  const [contrast, setContrast] = useState('normal');
  const [font, setFont] = useState('default');
  const [mode, setMode] = useState(['universal']);
  const [activeTab, setActiveTab] = useState('ai');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  const [readerText, setReaderText] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState(null);
  const [savedSummaries, setSavedSummaries] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  const [sttText, setSttText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
          fetchHistory(session.user.id);
          const meta = session.user.user_metadata;
          if (meta.theme) setTheme(meta.theme);
          if (meta.contrast) setContrast(meta.contrast);
          if (meta.font) setFont(meta.font);
          if (meta.mode) setMode(Array.isArray(meta.mode) ? meta.mode : [meta.mode]);
        }
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
          fetchHistory(session.user.id);
          const meta = session.user.user_metadata;
          if (meta.theme) setTheme(meta.theme);
          if (meta.contrast) setContrast(meta.contrast);
          if (meta.font) setFont(meta.font);
          if (meta.mode) setMode(Array.isArray(meta.mode) ? meta.mode : [meta.mode]);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-contrast', contrast);
    document.documentElement.setAttribute('data-font', font);
    document.documentElement.setAttribute('data-mode', Array.isArray(mode) ? mode.join(' ') : mode);
  }, [theme, contrast, font, mode]);

  const updatePreference = async (key, value) => {
    if (!session) return;
    await supabase.auth.updateUser({ data: { [key]: value } });
  };

  const fetchHistory = async (userId) => {
    const { data: summData } = await supabase.from('summaries').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (summData) setSavedSummaries(summData);
    const { data: noteData } = await supabase.from('voice_notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (noteData) setSavedNotes(noteData);
  };

  const updateTheme = (val) => { setTheme(val); updatePreference('theme', val); };
  const updateContrast = (val) => { setContrast(val); updatePreference('contrast', val); };
  const updateFont = (val) => { setFont(val); updatePreference('font', val); };
  const updateMode = (val) => { setMode(val); updatePreference('mode', val); };

  const toggleModeSelection = (val) => {
    let newModes = [...(Array.isArray(mode) ? mode : [mode])];
    if (val === 'universal') {
      newModes = ['universal'];
    } else {
      newModes = newModes.filter(m => m !== 'universal');
      if (newModes.includes(val)) {
        newModes = newModes.filter(m => m !== val);
        if (newModes.length === 0) newModes = ['universal'];
      } else {
        newModes.push(val);
      }
    }
    updateMode(newModes);
  };

  const toggleReadAloud = () => {
    if (!('speechSynthesis' in window)) return alert("Browser doesn't support TTS.");
    if (isReading) { window.speechSynthesis.cancel(); setIsReading(false); return; }
    const utteranceText = simplifiedText?.trim() ? simplifiedText : readerText;
    if (!utteranceText?.trim()) return;

    // Remove markdown symbols and emojis so TTS only reads plain text
    const cleanText = utteranceText
      .replace(/[*_#`~>]/g, '')
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleSimplify = async () => {
    if (!readerText.trim()) { setSimplifiedText("⚠️ Paste some text first."); return; }
    
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      alert("Please configure VITE_GEMINI_API_KEY in .env.local to use AI.");
      return;
    }

    setIsAILoading(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Simplify the following text extensively for a student with learning disabilities. Keep the vocabulary extremely basic. Break it into a few short sentences, and use bullet points with visual emojis if it helps structure the concepts. DO NOT output backticks or json. Text:\n\n${readerText}` }] }]
        })
      });
      if (!res.ok) throw new Error("API Network Error");
      const data = await res.json();
      setSimplifiedText("✨ [Simplified View] ✨\n\n" + data.candidates[0].content.parts[0].text.trim());
    } catch (err) {
      console.error(err);
      setSimplifiedText("⚠️ AI failed to simplify text due to a network error.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!readerText.trim()) { setSimplifiedText("⚠️ Paste some text first."); return; }
    
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      alert("Please configure VITE_GEMINI_API_KEY in .env.local to use AI.");
      return;
    }

    setIsAILoading(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Summarize the following text into exactly 5 bullet points. Make it an executive summary capturing the absolute core, most critical facts. Do not include any extra fluff. DO NOT output backticks or json. Text:\n\n${readerText}` }] }]
        })
      });
      if (!res.ok) throw new Error("API Network Error");
      const data = await res.json();
      setSimplifiedText("⭐ Key Points:\n\n" + data.candidates[0].content.parts[0].text.trim());
    } catch (err) {
      console.error(err);
      setSimplifiedText("⚠️ AI failed to summarize text due to a network error.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!simplifiedText || !session) return;
    setIsSaving(true);
    const { data, error } = await supabase.from('summaries').insert([{ user_id: session.user.id, original_text: readerText, summary_text: simplifiedText }]).select();
    if (!error) setSavedSummaries([data[0], ...savedSummaries]);
    setIsSaving(false);
  };

  const handleSaveNote = async () => {
    if (!sttText.trim() || !session) return;
    setIsSaving(true);
    const { data, error } = await supabase.from('voice_notes').insert([{ user_id: session.user.id, transcription: sttText }]).select();
    if (!error) setSavedNotes([data[0], ...savedNotes]);
    setIsSaving(false);
  };

  const toggleListening = () => {
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support STT.");
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) setSttText(prev => prev + event.results[i][0].transcript + ' ');
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    const reader = new FileReader();
    try {
      if (file.type === 'application/pdf') {
        reader.onload = async () => {
          const typedarray = new Uint8Array(reader.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
          }
          setReaderText(fullText);
          setIsExtracting(false);
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.docx')) {
        reader.onload = async () => {
          const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
          setReaderText(result.value);
          setIsExtracting(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert("Please upload a PDF or .docx file.");
        setIsExtracting(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to extract text.");
      setIsExtracting(false);
    }
  };

  if (!session) return <Auth />;

  const STATS = [
    { label: 'Students Served', value: 1200, suffix: '+' },
    { label: 'Summaries Generated', value: savedSummaries.length > 0 ? savedSummaries.length : 5, suffix: '' },
    { label: 'Notes Saved', value: savedNotes.length > 0 ? savedNotes.length : 3, suffix: '' },
    { label: 'Accessibility Modes', value: 3, suffix: '' },
  ];

  const FEATURES = [
    { icon: <Volume2 size={32} />, title: 'Text-to-Speech', desc: 'Listen to any content read aloud for visual impairments & ADHD.', color: '#6366f1' },
    { icon: <Mic size={32} />, title: 'Voice Dictation', desc: 'Speak your thoughts and bypass typing barriers instantly.', color: '#0ea5e9' },
    { icon: <Brain size={32} />, title: 'AI Summarization', desc: 'Extract key points to reduce cognitive overload.', color: '#8b5cf6' },
    { icon: <Paperclip size={32} />, title: 'PDF & Word Support', desc: 'Upload textbooks and lecture notes directly into the tool.', color: '#f59e0b' },
    { icon: <Eye size={32} />, title: 'High Contrast', desc: 'Supercharged contrast for low-vision students.', color: '#ef4444' },
    { icon: <Type size={32} />, title: 'Dyslexia Font', desc: 'Weighted character bottoms to prevent letter flipping.', color: '#10b981' },
  ];

  return (
    <div className="app-container">
      <OrbBackground />

      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '0 0.5rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.03em' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
              <Activity size={28} />
            </div>
            LearnAssist
          </h1>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Active Profile</p>
            <p style={{ color: 'var(--text-color)', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.email}</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {[
            { id: 'ai', icon: <Brain size={22} />, label: 'AI Assistant' },
            { id: 'home', icon: <Zap size={22} />, label: 'Dashboard' },
            { id: 'reader', icon: <BookOpen size={22} />, label: 'Reading Assistant' },
            { id: 'voice', icon: <Mic size={22} />, label: 'Voice Dictation' },
            { id: 'settings', icon: <Settings size={22} />, label: 'Settings' },
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border)' }} onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Scrollable Area */}
      <main className="main-content" style={{ overflowY: 'auto', maxHeight: '100vh', paddingBottom: '6rem' }}>

        {/* Header — floating pill */}
        <header style={{
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '1rem',
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          padding: '0.875rem 1.5rem',
          borderRadius: '100px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{ letterSpacing: '-0.02em', fontSize: '1.1rem', margin: 0 }}>
            {activeTab === 'home'     && '✨ Dashboard'}
            {activeTab === 'reader'   && '📖 Reading Assistant'}
            {activeTab === 'voice'    && '🎙️ Voice Notebook'}
            {activeTab === 'ai'       && '🤖 AI Voice Assistant'}
            {activeTab === 'settings' && '⚙️ Accessibility'}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', marginRight: '0.5rem' }}>
              <button 
                onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-color)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {mode.includes('universal') ? '🌎 Universal Mode' : `🛠️ ${mode.length} Modes Active`}
                <ChevronDown size={14} />
              </button>
              
              {isModeMenuOpen && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0, width: '240px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: '12px', padding: '0.5rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  {[
                    { val: "universal", label: "🌎 Universal (Default)" },
                    { val: "visual", label: "👁️ Visual Impairment" },
                    { val: "hearing", label: "👂 Hearing Impairment" },
                    { val: "dyslexia", label: "📖 Dyslexia" },
                    { val: "dysgraphia", label: "✍️ Dysgraphia" },
                    { val: "dyscalculia", label: "🔢 Dyscalculia" },
                    { val: "asd", label: "🧩 Autism (ASD)" },
                    { val: "adhd", label: "🎯 ADHD Focus" },
                    { val: "calm", label: "🧘 Calm Mode" }
                  ].map(opt => (
                    <label key={opt.val} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px',
                      cursor: 'pointer', background: mode.includes(opt.val) ? 'var(--primary-light)' : 'transparent',
                      color: mode.includes(opt.val) ? 'var(--primary)' : 'var(--text-color)', fontSize: '0.85rem'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={mode.includes(opt.val)} 
                        onChange={() => toggleModeSelection(opt.val)} 
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      {opt.label}
                    </label>
                  ))}
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <button onClick={() => setIsModeMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              )}
            </div>
            <button className="btn-icon" onClick={() => updateTheme(theme === 'light' ? 'dark' : 'light')} title="Toggle dark mode">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="btn-icon" onClick={() => updateContrast(contrast === 'normal' ? 'high' : 'normal')} title="Toggle high contrast">
              <Eye size={18} />
            </button>
          </div>
        </header>

        {/* ====== HOME / DASHBOARD TAB ====== */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <RevealCard style={{ marginBottom: '3rem' }}>
              <div className="hero-section">
                <div className="hero-badge">
                  <Sparkles size={14} /> AI-Powered Accessibility
                </div>
                <h1 className="hero-title">
                  Learning Without<br />
                  <span className="hero-gradient-text">Barriers</span>
                </h1>
                <p className="hero-subtitle">
                  An adaptive AI assistant built for students with visual, cognitive, and hearing disabilities — turning every document into an accessible learning experience.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('reader')}>
                    <BookOpen size={18} /> Start Reading
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('voice')}>
                    <Mic size={18} /> Voice Mode
                  </button>
                </div>
              </div>
            </RevealCard>

            {/* Stats Bar */}
            <RevealCard delay={100} style={{ marginBottom: '3rem' }}>
              <div className="stats-bar">
                {STATS.map((s, i) => (
                  <div key={i} className="stat-item">
                    <div className="stat-value">
                      <AnimatedCounter target={s.value} suffix={s.suffix} />
                    </div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </RevealCard>

            {/* Feature Cards Grid */}
            <div style={{ marginBottom: '1.5rem' }}>
              <RevealCard delay={0}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Core Features</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Every tool built with one purpose: remove the barrier between students and knowledge.</p>
              </RevealCard>
              <div className="feature-grid">
                {FEATURES.map((f, i) => (
                  <RevealCard key={i} delay={i * 80}>
                    <div className="feature-card">
                      <div className="feature-icon" style={{ background: f.color + '20', color: f.color }}>
                        {f.icon}
                      </div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </RevealCard>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {(savedSummaries.length > 0 || savedNotes.length > 0) && (
              <RevealCard delay={200} style={{ marginTop: '3rem' }}>
                <div className="card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={22} /> Recent Activity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {savedSummaries.slice(0, 2).map(s => (
                      <div key={s.id} className="activity-row" onClick={() => { setSimplifiedText(s.summary_text); setActiveTab('reader'); }}>
                        <div className="activity-icon" style={{ background: '#6366f120', color: '#6366f1' }}><FileText size={16} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Saved Summary</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>Open →</div>
                      </div>
                    ))}
                    {savedNotes.slice(0, 2).map(n => (
                      <div key={n.id} className="activity-row" onClick={() => { setSttText(n.transcription); setActiveTab('voice'); }}>
                        <div className="activity-icon" style={{ background: '#0ea5e920', color: '#0ea5e9' }}><Mic size={16} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Voice Note</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>Open →</div>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealCard>
            )}
          </div>
        )}

        {/* ====== READER TAB ====== */}
        {activeTab === 'reader' && (
          <div>
            <RevealCard>
              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><FileText /> Lesson Material</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Paste your lesson or upload a PDF/Word file — then read it aloud or extract the core summary.</p>
                <div style={{ position: 'relative' }}>
                  <textarea className="textarea" placeholder="Paste your learning material here, or upload a file..." value={readerText} onChange={(e) => setReaderText(e.target.value)} style={{ paddingRight: '4rem' }} />
                  <button className="btn-icon" onClick={() => fileInputRef.current?.click()} disabled={isExtracting} style={{ position: 'absolute', right: '1rem', top: '1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '40px', height: '40px' }}>
                    {isExtracting ? <Loader2 className="spin" size={20} /> : <Paperclip size={20} />}
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf,.docx" onChange={handleFileChange} />
                </div>

                {isExtracting && (
                  <div className="extraction-banner">
                    <Loader2 className="spin" size={18} /> Extracting text from file — this may take a moment...
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={toggleReadAloud}>
                    {isReading ? <><VolumeX size={18} /> Stop Reading</> : <><Volume2 size={18} /> Read Aloud</>}
                  </button>
                  <button className="btn btn-secondary" onClick={handleSimplify} disabled={isAILoading}>
                    {isAILoading ? <><Loader2 className="spin" size={18} /> Thinking...</> : <><Sparkles size={18} /> Simplify</>}
                  </button>
                  <button className="btn btn-secondary" onClick={handleSummarize} disabled={isAILoading}>
                    {isAILoading ? <><Loader2 className="spin" size={18} /> Thinking...</> : <><BookOpen size={18} /> Summarize</>}
                  </button>
                </div>
              </div>
            </RevealCard>

            {simplifiedText && (
              <RevealCard delay={100}>
                <div className="card result-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h4 style={{ color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={20} /> Smart Breakdown</h4>
                    <button className="btn btn-primary" onClick={handleSaveSummary} disabled={isSaving} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      {isSaving ? 'Saving...' : 'Save to History'}
                    </button>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.9', fontSize: '1rem' }}>
                    <BionicText text={simplifiedText} activeModes={Array.isArray(mode) ? mode : [mode]} />
                  </p>
                </div>
              </RevealCard>
            )}

            <div style={{ marginTop: '1rem' }}>
              <RevealCard delay={150}>
                <h4 style={{ marginBottom: '1.25rem', opacity: 0.8 }}>Previous Lessons ({savedSummaries.length})</h4>
              </RevealCard>
              {savedSummaries.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {savedSummaries.map((s, i) => (
                    <RevealCard key={s.id} delay={i * 60}>
                      <div className="history-row" onClick={() => setSimplifiedText(s.summary_text)}>
                        <div className="history-icon"><FileText size={18} /></div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{new Date(s.created_at).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.9rem' }}>{s.summary_text.slice(0, 120)}...</div>
                        </div>
                        <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>Load →</span>
                      </div>
                    </RevealCard>
                  ))}
                </div>
              ) : (
                <RevealCard delay={200}>
                  <div className="empty-state"><FileText size={48} /><p>No saved summaries yet. Your history will appear here!</p></div>
                </RevealCard>
              )}
            </div>
          </div>
        )}

        {/* ====== VOICE TAB ====== */}
        {activeTab === 'voice' && (
          <div>
            <RevealCard>
              <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mic /> Voice Dictation</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Speak to write your essays, answers, or notes.</p>

                <div className={`mic-zone ${isListening ? 'listening' : ''}`}>
                  <div className={`mic-rings ${isListening ? 'active' : ''}`}>
                    <span /><span /><span />
                  </div>
                  <button
                    className={`mic-btn ${isListening ? 'mic-btn-active' : ''}`}
                    onClick={toggleListening}
                  >
                    {isListening ? <MicOff size={40} /> : <Mic size={40} />}
                  </button>
                  <p className="mic-label">
                    {isListening ? '🔴 Listening... Click to stop' : 'Click to start recording'}
                  </p>
                </div>

                <textarea className="textarea" style={{ marginTop: '1.5rem', minHeight: '180px' }} value={sttText} onChange={(e) => setSttText(e.target.value)} placeholder="Your transcribed text will appear here..." />
                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setSttText('')} style={{ fontSize: '0.85rem' }}>Clear</button>
                  <button className="btn btn-primary" onClick={handleSaveNote} disabled={isSaving || !sttText.trim()}>
                    {isSaving ? 'Saving...' : 'Save to Notebook'}
                  </button>
                </div>
              </div>
            </RevealCard>

            <div style={{ marginTop: '1rem' }}>
              <RevealCard delay={100}>
                <h4 style={{ marginBottom: '1.25rem', opacity: 0.8 }}>Voice Notebook ({savedNotes.length})</h4>
              </RevealCard>
              {savedNotes.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {savedNotes.map((n, i) => (
                    <RevealCard key={n.id} delay={i * 60}>
                      <div className="note-card" onClick={() => setSttText(n.transcription)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <Mic size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{n.transcription.slice(0, 180)}{n.transcription.length > 180 ? '...' : ''}</p>
                      </div>
                    </RevealCard>
                  ))}
                </div>
              ) : (
                <RevealCard delay={150}>
                  <div className="empty-state"><Mic size={48} /><p>Your Voice Notebook is empty. Start recording to save notes!</p></div>
                </RevealCard>
              )}
            </div>
          </div>
        )}

        {/* ====== SETTINGS TAB ====== */}
        {activeTab === 'settings' && (
          <div>
            <RevealCard>
              <div className="card accessibility-panel">
                <h3>Visual & Cognitive Preferences</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Your settings are automatically saved to your profile and applied on next login.</p>
                <div className="toggle-group" onClick={() => updateTheme(theme === 'light' ? 'dark' : 'light')}>
                  <div className="toggle-label"><Moon size={20} /> Dark Theme</div>
                  <label className="switch"><input type="checkbox" checked={theme === 'dark'} readOnly /><span className="slider"></span></label>
                </div>
                <div className="toggle-group" onClick={() => updateContrast(contrast === 'normal' ? 'high' : 'normal')}>
                  <div className="toggle-label"><Eye size={20} /> Maximum Contrast</div>
                  <label className="switch"><input type="checkbox" checked={contrast === 'high'} readOnly /><span className="slider"></span></label>
                </div>
                <div className="toggle-group" onClick={() => updateFont(font === 'default' ? 'dyslexia' : 'default')}>
                  <div className="toggle-label"><Type size={20} /> Dyslexia-Friendly Font</div>
                  <label className="switch"><input type="checkbox" checked={font === 'dyslexia'} readOnly /><span className="slider"></span></label>
                </div>
              </div>
            </RevealCard>

            <RevealCard delay={150}>
              <div className="card" style={{ marginTop: 0 }}>
                <h3 style={{ marginBottom: '1.5rem' }}>About LearnAssist</h3>
                <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                  {[
                    { icon: <Shield size={24} />, label: 'Privacy First', desc: 'Your data is encrypted and protected by RLS policies.' },
                    { icon: <Users size={24} />, label: 'Built for All', desc: 'Designed for students with visual, cognitive, and hearing disabilities.' },
                    { icon: <Zap size={24} />, label: 'Instant Access', desc: 'Zero loading screens. Everything runs in real-time.' },
                  ].map((item, i) => (
                    <div key={i} className="feature-card" style={{ padding: '1.25rem' }}>
                      <div className="feature-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{item.icon}</div>
                      <h4>{item.label}</h4>
                      <p style={{ fontSize: '0.85rem' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealCard>
          </div>
        )}

        {/* ====== AI ASSISTANT TAB ====== */}
        {activeTab === 'ai' && (
          <RevealCard>
            <AIAssistant readerText={readerText} currentMode={mode} setMode={updateMode} />
          </RevealCard>
        )}

      </main>
    </div>
  );
}

export default App;

// Bionic Reading Algorithm Helper for App-level components
function BionicText({ text, activeModes }) {
  if (!activeModes.includes('dyslexia') && !activeModes.includes('adhd')) {
    return <>{text}</>;
  }
  
  const parts = text.split(/(\s+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.trim() || part.length < 2) return <span key={i}>{part}</span>;
        const mid = Math.ceil(part.length / 2);
        return (
          <span key={i}>
            <b style={{ fontWeight: 800 }}>{part.slice(0, mid)}</b>
            {part.slice(mid)}
          </span>
        );
      })}
    </>
  );
}
