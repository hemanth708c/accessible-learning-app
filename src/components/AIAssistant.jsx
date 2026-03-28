import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Send, Upload, Download, FileText, Loader2, Brain, Sparkles, 
  Eye, PenTool, Edit3, Calculator, HelpCircle, MessageCircle, Users, FileType, CheckCircle2, Music, ListTodo, Volume2 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/UniversalWorkspace.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function AIAssistant({ readerText, currentMode, setMode }) {
  const activeModesArray = Array.isArray(currentMode) ? currentMode : [currentMode];
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [dynamicMicSubText, setDynamicMicSubText] = useState('Click mic or Spacebar to activate');
  
  const [transcript, setTranscript] = useState([
    { role: 'system', text: "Hi! I am VisionAI, your Universal Learning Assistant. I'm ready to help you read, write, and understand." }
  ]);
  const [activeContext, setActiveContext] = useState("[ Context is empty. Upload a file, type a prompt, or click a magic button to begin. ]");
  const [contextType, setContextType] = useState('empty');
  
  const [mindMapData, setMindMapData] = useState(null);

  const [virtualFs, setVirtualFs] = useState({
    "edited_text.txt": { type: "text", content: "[ Empty - Any edited or simplified text will appear here. ]" },
    "voice_written.txt": { type: "text", content: "[ Empty - Voice dictation drafts will be saved here. ]" },
    "handwriting_transcripts.txt": { type: "text", content: "[ Empty - AI transcribed handwriting will be stored here. ]" },
    "daily_notes.txt": { type: "text", content: "Smart Notetaker Log (Auto-records daily conversation):\n\n" }
  });

  const recognitionRef = useRef(null);
  const transcriptRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const handwritingInputRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, isProcessing]);

  useEffect(() => {
    if (readerText?.trim() && contextType === 'empty') {
      setActiveContext(readerText);
      setContextType("lesson-material.txt");
    }
  }, [readerText]);

  const addLog = (role, text) => {
    setTranscript(prev => [...prev, { role, text }]);
  };

  const speakText = (text, isSinging = false) => {
    if (!text || !('speechSynthesis' in window)) return;
    // Strip emojis and markdown formatting to prevent Windows TTS silent crashes
    const cleanText = text.replace(/[*_#`🎵🎶]/g, '')
                          .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}]/gu, '')
                          .trim();
    if (!cleanText) return;
    window.speechSynthesis.cancel();

    if (isSinging) {
      setIsSpeaking(true);
      const bits = cleanText.split(/[\n.,!?;]+/).filter(l => l.trim().length > 0);
      let i = 0;
      const speakNext = () => {
        if (i >= bits.length) {
          setIsSpeaking(false);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(bits[i].trim());
        utterance.rate = 0.75;
        // Random pitch between 0.3 and 1.8 for a bouncy synthesized singing voice
        utterance.pitch = 0.3 + (Math.random() * 1.5);
        utterance.onend = () => { i++; speakNext(); };
        utterance.onerror = () => { setIsSpeaking(false); };
        window.speechSynthesis.speak(utterance);
      };
      if (bits.length > 0) speakNext();
      else setIsSpeaking(false);
      addLog('system', `[Singing] ${text}`);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const activeModes = Array.isArray(currentMode) ? currentMode : [currentMode];
    utterance.rate = activeModes.includes('dyslexia') ? 0.85 : 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    addLog('system', text);
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support strictly voice input.");

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      addLog('user', text);
      processCommand(text);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    const startPhrases = ["I'm listening...", "Go ahead...", "I'm ready..."];
    const phrase = startPhrases[Math.floor(Math.random() * startPhrases.length)];
    setDynamicMicSubText(phrase);

    const startRecognition = () => {
      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch(err) {
        console.error(err);
        setIsListening(false);
      }
    };

    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.onend = startRecognition;
      utterance.onerror = startRecognition;
      window.speechSynthesis.speak(utterance);
    } else {
      startRecognition();
    }
  };

  const toggleMicRef = useRef();
  useEffect(() => {
    toggleMicRef.current = toggleMic;
  });

  useEffect(() => {
    const handleGlobalSpace = (e) => {
      if (e.repeat) return; // Prevent rapid toggling if key is held down
      if ((e.code === 'Space' || e.key === ' ') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        if (toggleMicRef.current) toggleMicRef.current();
      }
    };

    const handleGlobalClick = (e) => {
      // Ignore clicks on interactive elements so we don't accidentally intercept user navigation/typing
      if (e.target.closest('button, input, textarea, a, select, label')) return;
      
      // A tap/click on any "empty" space acts as a giant accessibility switch to toggle voice mode
      e.preventDefault();
      if (toggleMicRef.current) toggleMicRef.current();
    };

    window.addEventListener('keydown', handleGlobalSpace);
    window.addEventListener('click', handleGlobalClick); // Handles both mouse clicks and mobile taps
    
    return () => {
      window.removeEventListener('keydown', handleGlobalSpace);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleSendText = () => {
    if (!inputText.trim()) return;
    addLog('user', inputText);
    processCommand(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendText();
  };

  const processCommand = async (rawText) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      addLog('system', "Please configure VITE_GEMINI_API_KEY in .env.local to use advanced AI features.");
      return;
    }


    setIsProcessing(true);
    const stopPhrases = ["Let me think...", "Processing...", "Got it..."];
    const phrase = stopPhrases[Math.floor(Math.random() * stopPhrases.length)];
    setDynamicMicSubText(phrase);
    if (window.speechSynthesis) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(phrase));
    }
    
    // Update Smart Notetaker log
    const updatedFs = { ...virtualFs };
    if (updatedFs["daily_notes.txt"]) {
      updatedFs["daily_notes.txt"].content += `\nYou said: ${rawText}\n`;
      setVirtualFs(updatedFs);
    }

    const fileNames = Object.keys(virtualFs).join(", ");
    const dailyNotes = virtualFs["daily_notes.txt"]?.content || "";
    
    let modeInst = "";
    const activeModes = Array.isArray(currentMode) ? currentMode : [currentMode];
    if (activeModes.includes('visual')) modeInst += "User is blind. Be highly descriptive. Summarize long texts effectively. ";
    if (activeModes.includes('hearing')) modeInst += "User is deaf. Keep spokenResponse matching exactly what you print. Use clear formatting. ";
    if (activeModes.includes('dyslexia')) modeInst += "User has Dyslexia. Use simple vocabulary, short sentences, and visual structures where possible. If Voice Writing, act as a scribe and ask short clarifying questions. ";
    if (activeModes.includes('dysgraphia')) modeInst += "User has Dysgraphia. Focus on spelling, grammar correction, and very clear formatting of written text. ";
    if (activeModes.includes('dyscalculia')) modeInst += "User has Dyscalculia. Convert abstract math into highly interactive, relatable storytelling. Use concrete objects. ";
    if (activeModes.includes('asd')) modeInst += "User has Autism Spectrum Disorder (ASD). Communicate purely literally. Provide gentle emotional support. Decode tone explicitly. Generate literal, calming step-by-step Social Stories. ";
    if (activeModes.includes('adhd')) modeInst += "User is in Focus Mode. Keep responses extremely concise. Use bullet points. No fluff. ";
    if (activeModes.includes('calm')) modeInst += "CALM MODE ACTIVE: Use extremely reassuring, slow-paced, and empathetic language. Break things into one tiny step at a time. Use simple vocabulary. Max 2-3 short sentences. ";

    const systemPrompt = `You are VisionAI, an Adaptive Educational Assistant.
Current UI Modes: ${activeModes.join(', ')}. Instructions: ${modeInst}
Current screen context: ${mindMapData ? JSON.stringify(mindMapData) : activeContext}
Files available: ${fileNames}

Smart Notetaker Log (Today):
${dailyNotes}

Determine response to user command. 
- If asked to turn math into a story, set action "UPDATE_CONTEXT", provide the story in newContext.
- If asked for a MIND MAP or VISUAL BREAKDOWN, set action "GENERATE_MINDMAP", populate the mindMap object.
- If asked to EXPLAIN EMOTIONS/DECODE TONE, set action "UPDATE_CONTEXT", explicitly state emotions in newContext.
- If asked for a SOCIAL STORY, write a calming literal first-person step-by-step story. Set action "UPDATE_CONTEXT". Ensure entire story is also in spokenResponse.
- IF user expresses being overwhelmed, stressed, panicked, confused, or asks to simplify/slow down, AUTOMATICALLY set action "CHANGE_MODE", add "calm" to targetModesToAdd array, and reply softly and reassuringly.
- If asking to OPEN a file, set action "OPEN_VIRTUAL_FILE", provide fileName.
- If asking to START DRAFT, DICTATION, or ROLEPLAY, set action "START_DRAFT", put initial setup text in newContext.
- IF generating a QUIZ, set action "UPDATE_CONTEXT".
- If asking to SWITCH MODES (e.g. "turn on dyslexia and focus mode", "turn off autism mode"), set action "CHANGE_MODE", and populate targetModesToAdd and targetModesToRemove arrays with modes: [visual, hearing, dyslexia, dysgraphia, dyscalculia, asd, adhd, calm, universal].
- If asked to EXPORT, SAVE, or DOWNLOAD the current document, set action "EXPORT_FILE".
- If none of these, but context was updated, use "UPDATE_CONTEXT".
- IF user says "listen to the song" or asks to listen to music to get lyrics, set action "START_SONG_LISTENING".
- IF user asks you to SING A SONG or "sing", set action "SING_SONG", write a fun short-lined song in newContext, and put the lyrics in spokenResponse.

Return JSON exactly adhering to this schema:
{
  "spokenResponse": "Text to read aloud or print in chat",
  "action": "NONE" | "UPDATE_CONTEXT" | "OPEN_VIRTUAL_FILE" | "READ_CONTEXT" | "CHANGE_MODE" | "START_DRAFT" | "EXPORT_FILE" | "GENERATE_MINDMAP" | "START_SONG_LISTENING" | "SING_SONG",
  "newContext": "New text content",
  "fileName": "name of file to open",
  "targetModesToAdd": ["mode1"],
  "targetModesToRemove": ["mode2"],
  "mindMap": {
    "root": "Central Topic",
    "branches": [{"name": "Branch", "details": ["Item 1"]}]
  }
}`;

    try {
      // ── Gemini call with auto-retry on 429 rate limits ──
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiBody = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: rawText }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      let res;
      let retryCount = 0;
      const MAX_RETRIES = 4;

      while (retryCount <= MAX_RETRIES) {
        res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: geminiBody
        });

        if (res.ok) break; // success

        if (res.status === 429) {
          let waitSec = 15; // default wait
          try {
            const errJson = await res.clone().json();
            // Extract retryDelay from Google's error details
            const retryInfo = errJson?.error?.details?.find(d => d['@type']?.includes('RetryInfo'));
            if (retryInfo?.retryDelay) {
              waitSec = Math.ceil(parseFloat(retryInfo.retryDelay.replace('s', ''))) + 2;
            }
          } catch (_) {}

          if (retryCount < MAX_RETRIES) {
            // Show live countdown in the UI
            addLog('system', `⏳ Gemini rate limit reached. Auto-retrying in ${waitSec}s… (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            for (let s = waitSec; s > 0; s--) {
              setDynamicMicSubText(`Rate limited — retrying in ${s}s…`);
              await new Promise(r => setTimeout(r, 1000));
            }
            retryCount++;
            continue;
          }
        }

        // Non-429 error or max retries exhausted
        const errorText = await res.text();
        throw new Error(`API call failed: ${res.status} - ${errorText}`);
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API call failed after retries: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      let rawResponseText = data.candidates[0].content.parts[0].text.trim();
      
      // Strip markdown backticks if Gemini includes them
      if (rawResponseText.startsWith('```')) {
        rawResponseText = rawResponseText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const responseData = JSON.parse(rawResponseText);

      let spoken = responseData.spokenResponse || "Done.";

      if (updatedFs["daily_notes.txt"]) {
        updatedFs["daily_notes.txt"].content += `AI replied: ${spoken}\n`;
        setVirtualFs(updatedFs);
      }

      setMindMapData(null); // Clear previous mindmap state by default

      if (responseData.action === "UPDATE_CONTEXT" || responseData.action === "START_DRAFT") {
        const targetFilename = responseData.action === "START_DRAFT" ? "voice_written.txt" : "edited_text.txt";
        setActiveContext(responseData.newContext);
        setContextType(targetFilename);
        
        const fsCopy = { ...updatedFs };
        if (!fsCopy[targetFilename]) fsCopy[targetFilename] = { type: 'text', content: '' };
        fsCopy[targetFilename].content = responseData.newContext;
        setVirtualFs(fsCopy);
      } else if (responseData.action === "GENERATE_MINDMAP" && responseData.mindMap) {
        setMindMapData(responseData.mindMap);
        setContextType("Visual Mind Map");
      } else if (responseData.action === "OPEN_VIRTUAL_FILE") {
        const file = virtualFs[responseData.fileName];
        if (file) {
          setActiveContext(file.content);
          setContextType(responseData.fileName);
          spoken = `Opened ${responseData.fileName}.`;
        } else {
          spoken = `File not found in learning modules.`;
        }
      } else if (responseData.action === "EXPORT_FILE") {
        handleExport();
        spoken = "Downloading document now.";
      } else if (responseData.action === "START_SONG_LISTENING") {
        spoken = "Listening to the song now. Please let it play for ten seconds.";
        setTimeout(() => startAudioRecording(), 2500);
      } else if (responseData.action === "CHANGE_MODE") {
        if (setMode) {
          let active = Array.isArray(currentMode) ? [...currentMode] : [currentMode];
          
          if (Array.isArray(responseData.targetModesToRemove)) {
            responseData.targetModesToRemove.forEach(m => { active = active.filter(x => x !== m); });
          }
          if (Array.isArray(responseData.targetModesToAdd)) {
            responseData.targetModesToAdd.forEach(m => {
              if (m === 'universal') {
                active = ['universal'];
              } else {
                active = active.filter(x => x !== 'universal');
                if (!active.includes(m)) active.push(m);
              }
            });
          }
          
          if (active.length === 0) active = ['universal'];
          setMode(active);
        }
      } else if (responseData.action === "READ_CONTEXT") {
        spoken = activeContext;
      } else if (responseData.action === "SING_SONG") {
        setActiveContext(responseData.newContext);
        setContextType("Vocal Performance");
      }

      speakText(spoken, responseData.action === "SING_SONG");

    } catch (err) {
      console.error(err);
      addLog('system', `Error: ${err.message}. Check browser console for details.`);
    } finally {
      setIsProcessing(false);
      setDynamicMicSubText('Click mic or Spacebar to activate');
      
      // Haptic Feedback for Deaf users (Suppress if ASD to prevent sensory overload)
      const active = Array.isArray(currentMode) ? currentMode : [currentMode];
      if (active.includes('hearing') && !active.includes('asd') && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  // Music Listening Capacity
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(true);
        addLog('system', 'Analyzing song audio using VisionAI...');
        setDynamicMicSubText('Analyzing song...');
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result.split(',')[1];
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: "user",
                  parts: [
                    { text: "Listen to this audio clip. Identify the song and provide the full lyrics for it. If it's not a song, transcribe it or describe the audio." },
                    { inlineData: { mimeType: "audio/webm", data: base64 } }
                  ]
                }]
              })
            });
            const data = await res.json();
            const desc = data.candidates[0].content.parts[0].text;
            setActiveContext(desc);
            setContextType("Song Lyrics");
            setMindMapData(null);
            speakText("Here are the lyrics for the song.");
            addLog('system', 'Lyrics fetched successfully.');
          } catch (err) {
            console.error(err);
            addLog('system', 'Failed to analyze song audio.');
            speakText("Sorry, I couldn't analyze the song.");
          } finally {
            setIsProcessing(false);
            setDynamicMicSubText('Click mic or Spacebar to activate');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      setDynamicMicSubText('Listening to song... (Recording for 10s)');
      addLog('system', 'Microphone active. Listening for 10 seconds...');
      
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        setIsListening(false);
      }, 10000);

    } catch (err) {
      console.error(err);
      addLog('system', 'Microphone access denied or error recording audio.');
    }
  };

  // Generic File Upload for Text
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setVirtualFs(prev => ({ ...prev, [file.name]: { type: 'text', content } }));
      setActiveContext(content);
      setContextType(file.name);
      setMindMapData(null);
      addLog('system', `Loaded ${file.name}`);
      speakText(`Loaded ${file.name} successfully.`);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Vision / Image Upload
  const handleVisionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    addLog('system', 'Uploading image for Vision AI analysis...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(',')[1];
      const mime = file.type;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: "Describe this image in detail. Focus on colors, text, and layout for accessibility." },
                { inlineData: { mimeType: mime, data: base64 } }
              ]
            }]
          })
        });
        const data = await res.json();
        const desc = data.candidates[0].content.parts[0].text;
        setActiveContext(desc);
        setContextType("image-analysis.txt");
        setMindMapData(null);
        speakText("Vision analysis complete. " + desc);
      } catch (err) {
        addLog('system', 'Vision AI failed to read image.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Handwriting Upload
  const handleHandwritingUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    addLog('system', 'Transcribing handwriting...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result.split(',')[1];
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: "Extract and transcribe handwritten text exactly. Then provide a 'Corrected Version' that fixes grammar/spelling." },
                { inlineData: { mimeType: file.type, data: base64 } }
              ]
            }]
          })
        });
        const data = await res.json();
        const output = data.candidates[0].content.parts[0].text;
        setActiveContext(output);
        setContextType("handwriting_transcripts.txt");
        setVirtualFs(prev => ({ ...prev, "handwriting_transcripts.txt": { type: "text", content: output } }));
        setMindMapData(null);
        speakText("Handwriting transcribed and grammar corrected on screen.");
      } catch (err) {
        addLog('system', 'Failed to transcribe handwriting. Ensure the image is clear.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Export
  const handleExport = async () => {
    setIsProcessing(true);
    addLog('system', 'Generating visually formatted PDF study guide...');
    setDynamicMicSubText('Exporting PDF rendering...');
    
    try {
      const element = document.getElementById('bionic-export-container');
      if (!element) throw new Error("Export container missing.");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm padding
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      
      let baseName = contextType;
      if (baseName.includes('.')) baseName = baseName.split('.')[0];
      const finalName = `${baseName || 'document'}.pdf`;
      
      pdf.save(finalName);
      
      addLog('system', `Successfully downloaded ${finalName}`);
      speakText("Your formatted study guide has been downloaded successfully.");
    } catch (err) {
      console.error(err);
      addLog('system', 'Failed to generate PDF document.');
    } finally {
      setIsProcessing(false);
      setDynamicMicSubText('Click mic or Spacebar to activate');
    }
  };

  const statusClass = isListening ? 'status-listening' : isSpeaking ? 'status-speaking' : 'status-standby';
  const statusIcon = isListening ? <Mic size={64}/> : isSpeaking ? <Brain size={64}/> : <Mic size={64}/>;

  return (
    <div className="universal-workspace-container">
      
      {/* Hidden File Inputs */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept=".txt,.md,.json,.csv" />
      <input type="file" ref={imageInputRef} style={{ display: 'none' }} onChange={handleVisionUpload} accept="image/*" />
      <input type="file" ref={handwritingInputRef} style={{ display: 'none' }} onChange={handleHandwritingUpload} accept="image/*" />

      {/* LEFT: Voice GUI */}
      <div className="uw-panel uw-voice-panel focus-element">
        <button className={`uw-giant-mic ${statusClass}`} onClick={toggleMic} aria-label="Toggle Microphone">
          {statusIcon}
        </button>
        <div className="uw-mic-text">
          <h3>
            {isListening ? 'Listening...' : isProcessing ? 'Processing' : isSpeaking ? 'Speaking' : 'Standby'}
          </h3>
          <p className="uw-mic-sub">
            {isListening || isProcessing ? dynamicMicSubText : 'Click mic or Spacebar to activate'}
          </p>
        </div>
        
        {/* SPEAK FOR ME: AAC Quick Board */}
        <div className="uw-aac-board" style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            <Volume2 size={12} style={{ display: 'inline', marginRight: '4px' }}/> Speak For Me
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {["Yes 👍", "No 👎", "I need help ✋", "Too fast 🐢", "I need a break ⏸️", "Repeat that 🔄"].map((phrase) => (
               <button 
                 key={phrase} 
                 className="uw-magic-btn" 
                 style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.35rem 0.75rem', fontSize: '0.8rem', flex: '1 1 auto' }} 
                 onClick={() => speakText(phrase, false)}
                 aria-label={`Speak phrase: ${phrase}`}
               >
                 {phrase}
               </button>
            ))}
          </div>
        </div>

        <div className="uw-fallback-input">
          <input 
            type="text" 
            placeholder="Or type command here..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />
          <button className="uw-fallback-btn" onClick={handleSendText} disabled={isProcessing}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* MIDDLE: Virtual Learning Modules */}
      <div className="uw-panel uw-folder-panel non-focus-element">
        <div className="uw-folder-header">
          <h2><FileText size={16} /> Modules</h2>
          <button className="uw-upload-btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload
          </button>
        </div>
        <ul className="uw-folder-list">
          {Object.keys(virtualFs).map((fileName) => (
            <li key={fileName} className="uw-folder-item" onClick={() => processCommand(`Open ${fileName}`)}>
              <FileText size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
              <span title={fileName}>{fileName}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* RIGHT: Output & Context */}
      <div className="uw-right-panel focus-element">
        
        {/* Transcript Log */}
        <div className="uw-panel uw-transcript">
          <div className="uw-transcript-header">
            <MessageCircle size={16} /> Interaction Log
          </div>
          <div className="uw-transcript-log flash-trigger" ref={transcriptRef}>
            {transcript.map((msg, i) => (
              <div key={i} className={`uw-log-entry ${msg.role === 'user' ? 'uw-log-user' : 'uw-log-system'}`}>
                <div className="uw-log-label">{msg.role === 'user' ? 'You said:' : 'System:'}</div>
                <div>{msg.text}</div>
              </div>
            ))}
            {isProcessing && (
              <div className="uw-processing-bubble">
                <div className="uw-log-label" style={{ color: 'var(--primary)' }}><Loader2 size={12} className="spin" style={{ display: 'inline', marginRight: '4px' }}/> AI is thinking...</div>
              </div>
            )}
          </div>
        </div>

        {/* Active Context */}
        <div className="uw-panel uw-context" id="bionic-export-container">
          <div className="uw-context-header">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>Context:</span>
              <span style={{ border: '1px solid #38bdf8', color: '#38bdf8', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>{contextType}</span>
            </div>
            
            <div className="uw-magic-buttons">
              <button className="uw-magic-btn" onClick={() => imageInputRef.current?.click()}><Eye size={12}/> Vision</button>
              <button className="uw-magic-btn" onClick={() => handwritingInputRef.current?.click()}><Edit3 size={12}/> Read Handwriting</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Create a new writing text file and help structure my thoughts through voice writing.")}><PenTool size={12}/> Voice Write</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Turn the math problem in current text into a relatable story for Dyscalculia using concrete objects.")}><Calculator size={12}/> Math Help</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Generate an interactive 3-question voice quiz based on current context. Read first question.")}><HelpCircle size={12}/> Quiz</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Explain emotional tone and underlying feelings of text literally for Autism.")}><Smile size={12}/> Decode Tone</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Start low-stakes social practice roleplay. Ask scenario to begin.")}><Users size={12}/> Roleplay</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Write a calm literal Social Story to prepare me for an event. Ask me what the event is.")}><FileType size={12}/> Social Story</button>

              <button className="uw-magic-btn" onClick={() => processCommand("listen to the song")}><Music size={12}/> Listen to Song</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Simplify this text into short visual structures/bullet points.")}><Sparkles size={12}/> Simplify</button>
              <button className="uw-magic-btn" onClick={() => processCommand("Please take the current context and break it down into a highly literal, 1-2-3 step-by-step checklist.")}><ListTodo size={12}/> Chunk Task</button>
              {!mindMapData && activeContext.trim().length > 20 && <button className="uw-magic-btn" style={{ background: '#059669', color: 'white', borderColor: '#059669' }} onClick={handleExport}><Download size={12}/> Export</button>}
            </div>
          </div>
          
          <div className="uw-context-body">
            {mindMapData ? (
              <div className="uw-mindmap-container">
                <div className="uw-mindmap-root">{mindMapData.root || 'Central Topic'}</div>
                <div className="uw-mindmap-branches">
                  {mindMapData.branches?.map((branch, i) => (
                    <div key={i} className="uw-mindmap-branch-group">
                      <div className="uw-mindmap-branch">{branch.name || 'Branch'}</div>
                      <div className="uw-mindmap-details">
                        {branch.details?.map((detail, j) => (
                          <div key={j} className="uw-mindmap-detail">{detail}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <BionicText text={activeContext} activeModes={activeModesArray} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Minimal stub component to render the missing Smile icon without adding heavy custom SVG code to imports
function Smile({ size = 24, ...props }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
    )
}

// Bionic Reading Algorithm Helper
function BionicText({ text, activeModes }) {
  if (!activeModes.includes('dyslexia') && !activeModes.includes('adhd')) {
    return <>{text}</>;
  }
  
  // Split on words but preserve whitespace/newlines layout using regex
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
