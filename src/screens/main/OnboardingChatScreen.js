import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  getTodayOnboardingPrompt, processOnboardingAnswer,
  getDayProgress, completeDay, computeArchetype, ARCHETYPES,
} from '../../services/onboardingAI';
import { getFinancialData, saveProfile } from '../../services/storage';

const DEV_NO_QUESTION_LIMIT = false;

const QUICK_ACK_SYSTEM = `אתה VerMillion — מאמן פיננסי.
ענה בעברית ב-1-2 משפטים קצרים בלבד: הכר בתשובה, תן תגובה אנושית קצרה, אל תשאל שאלה חוזרת.`;

async function getQuickAck(field, answer) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${origin}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskType: 'quick_ack',
        systemPrompt: QUICK_ACK_SYSTEM,
        messages: [{ role: 'user', content: `שדה: ${field}\nתשובה: ${answer}` }],
      }),
    });
    if (!res.ok) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          text += parsed.choices?.[0]?.delta?.content || '';
        } catch { /* ignore */ }
      }
    }
    return text.trim() || null;
  } catch { return null; }
}

function BotBubble({ text, loading }) {
  return (
    <View style={styles.botRow}>
      <View style={styles.botAvatar}>
        <Text style={styles.botAvatarText}>V</Text>
      </View>
      <View style={styles.botBubble}>
        {loading
          ? <ActivityIndicator size="small" color="#C0392B" />
          : <Text style={styles.botText}>{text}</Text>
        }
      </View>
    </View>
  );
}

function UserBubble({ text }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

function ArchetypeRevealCard({ archetypeKey, onContinue }) {
  const arc = ARCHETYPES[archetypeKey] || ARCHETYPES.builder;
  return (
    <View style={[styles.revealCard, { borderColor: arc.color }]}>
      <Text style={styles.revealEmoji}>{arc.emoji}</Text>
      <Text style={[styles.revealTitle, { color: arc.color }]}>{arc.label}</Text>
      <Text style={styles.revealDesc}>{arc.desc}</Text>
      <Text style={styles.revealSub}>הדמות שלך עודכנה!</Text>
      <TouchableOpacity style={[styles.continueBtn, { backgroundColor: arc.color }]} onPress={onContinue}>
        <Text style={styles.continueBtnText}>המשך למשחקים ←</Text>
      </TouchableOpacity>
    </View>
  );
}

function DayCompleteCard({ day, onContinue }) {
  return (
    <View style={styles.doneCard}>
      <Text style={styles.doneEmoji}>✅</Text>
      <Text style={styles.doneTitle}>יום {day} הושלם!</Text>
      <Text style={styles.doneSub}>VerMillion מעכל את המידע. נמשיך מחר.</Text>
      <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
        <Text style={styles.continueBtnText}>חזור ←</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OnboardingChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, reloadProfile } = useAuth();

  const [currentDay, setCurrentDay]     = useState(1);
  const [messages, setMessages]         = useState([]);
  const [inputText, setInputText]       = useState('');
  const [currentField, setCurrentField] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [dayDone, setDayDone]           = useState(false);
  const [archetypeKey, setArchetypeKey] = useState(null);
  const [botLoading, setBotLoading]     = useState(false);
  const [sending, setSending]           = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    initDay();
  }, []);

  async function initDay() {
    const { currentDay: day } = await computeCurrentDay();
    setCurrentDay(day);
    const prompt = await getTodayOnboardingPrompt(day);
    if (!prompt) {
      setDayDone(true);
      return;
    }
    setCurrentField(prompt.field);
    setMessages([{ id: 1, role: 'bot', text: prompt.question }]);
  }

  async function computeCurrentDay() {
    const { getOnboardingState } = await import('../../services/storage');
    const state = await getOnboardingState();
    const completed = state?.daysCompleted || [];
    let day = 1;
    for (let d = 1; d <= 7; d++) {
      if (!completed.includes(d)) { day = d; break; }
      if (d === 7) day = 7;
    }
    return { currentDay: day };
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !currentField || sending) return;
    setSending(true);
    setInputText('');

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    scrollToBottom();

    await processOnboardingAnswer(currentField, text);
    const newCount = answeredCount + 1;
    setAnsweredCount(newCount);

    setBotLoading(true);
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: '', loading: true }]);
    scrollToBottom();

    const ack = await getQuickAck(currentField, text);
    setBotLoading(false);

    setMessages(prev => {
      const without = prev.filter(m => !m.loading);
      if (ack) return [...without, { id: Date.now() + 2, role: 'bot', text: ack }];
      return without;
    });

    const maxQ = DEV_NO_QUESTION_LIMIT ? 99 : 3;
    if (newCount >= maxQ) {
      await handleDayComplete(newCount);
    } else {
      await loadNextQuestion(newCount);
    }

    setSending(false);
    scrollToBottom();
  }

  async function loadNextQuestion(count) {
    const prompt = await getTodayOnboardingPrompt(currentDay);
    if (!prompt) {
      await handleDayComplete(count);
      return;
    }
    setCurrentField(prompt.field);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 3, role: 'bot', text: prompt.question }]);
      scrollToBottom();
    }, 600);
  }

  async function handleDayComplete(count) {
    await completeDay(currentDay);

    if (currentDay >= 3) {
      const financial = await getFinancialData();
      const key = computeArchetype(financial);
      const arc = ARCHETYPES[key];

      const currentStyle = profile?.avatar_style || {};
      await saveProfile({
        avatar_style: {
          ...currentStyle,
          archetype: key,
          ...(arc.hoodie ? { overrides: { ...(currentStyle.overrides || {}), hoodie: arc.hoodie } } : {}),
        },
      });
      reloadProfile?.();
      setArchetypeKey(key);
    } else {
      setDayDone(true);
    }
  }

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleContinue() {
    navigation.navigate('MainTabs');
  }

  const progress = Math.min((answeredCount / (DEV_NO_QUESTION_LIMIT ? 7 : 3)) * 100, 100);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>→</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>VerMillion · יום {currentDay}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map(msg =>
          msg.role === 'bot'
            ? <BotBubble key={msg.id} text={msg.text} loading={msg.loading} />
            : <UserBubble key={msg.id} text={msg.text} />
        )}

        {archetypeKey && (
          <ArchetypeRevealCard archetypeKey={archetypeKey} onContinue={handleContinue} />
        )}
        {dayDone && !archetypeKey && (
          <DayCompleteCard day={currentDay} onContinue={handleContinue} />
        )}
      </ScrollView>

      {!dayDone && !archetypeKey && (
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="כתוב את תשובתך..."
            placeholderTextColor="#555"
            multiline
            maxLength={500}
            textAlign="right"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.sendIcon}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#888',
    fontSize: 20,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#C0392B',
    borderRadius: 2,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  botRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  botAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  botBubble: {
    backgroundColor: '#161616',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  botText: {
    color: '#E8E8E8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#C0392B',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '75%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  revealCard: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  revealEmoji: {
    fontSize: 48,
  },
  revealTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  revealDesc: {
    color: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  revealSub: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
  doneCard: {
    marginTop: 20,
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27AE60',
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  doneEmoji: {
    fontSize: 48,
  },
  doneTitle: {
    color: '#27AE60',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  doneSub: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  continueBtn: {
    marginTop: 8,
    backgroundColor: '#C0392B',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    gap: 8,
    backgroundColor: '#0A0A0A',
  },
  input: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#222',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#2A1010',
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
