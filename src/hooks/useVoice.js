import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const STT_OK = isWeb && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
const TTS_OK = isWeb && !!window.speechSynthesis;

export function useVoice() {
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [muted, setMuted]               = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const recRef = useRef(null);

  const startListening = useCallback((onResult) => {
    if (!STT_OK) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'he-IL';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript) onResult(transcript);
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      if (!prev) { window.speechSynthesis?.cancel(); setSpeakingText(''); setIsSpeaking(false); }
      return !prev;
    });
  }, []);

  const speak = useCallback((text) => {
    if (!TTS_OK || muted) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_~`#​]/g, '').trim();
    if (!clean) return;

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const heVoice = voices.find(v => v.lang.startsWith('he'));
      if (heVoice) {
        utt.voice = heVoice;
        utt.lang  = 'he-IL';
      }
      utt.rate  = 1.0;
      utt.pitch = 1.0;
      utt.onstart = () => { setIsSpeaking(true); setSpeakingText(clean); };
      utt.onend   = () => { setIsSpeaking(false); setSpeakingText(''); };
      utt.onerror = () => { setIsSpeaking(false); setSpeakingText(''); };
      window.speechSynthesis.speak(utt);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!TTS_OK) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingText('');
  }, []);

  return { isListening, isSpeaking, muted, speakingText, startListening, stopListening, speak, stopSpeaking, toggleMute, supported: STT_OK };
}
