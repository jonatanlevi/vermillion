import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { mockUser } from '../../mock/data';
import { calcCompletion, getBlindSpots } from '../../data/dailyQuestions';
import { chatWithAI, getAIStatus } from '../../services/aiService';
import { askTeam } from '../../services/agents';
import { generatePersonalizedGreeting } from '../../services/aiPrompts';

// Feature flag — set to false to fall back to single-agent chatWithAI
const USE_AGENT_TEAM = true;
import { CONFIG } from '../../config';

const nextId = () => "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

export default function AICoachScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const completion = calcCompletion(mockUser.dailyAnswers || {});
  const blindSpots = getBlindSpots(mockUser.dailyAnswers || {});
  const [messages, setMessages] = useState(() => [{ id: nextId(), role: 'assistant', text: generatePersonalizedGreeting(mockUser) }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiOnline, setAiOnline] = useState(null); // null=checking, true=online, false=offline
  const flatListRef = React.useRef(null);
  const mountedRef = React.useRef(true);

  useEffect(() => {
    getAIStatus().then(ok => { if (mountedRef.current) setAiOnline(ok); });
  }, []);

  React.useEffect(() => {
    mountedRef.current = true;
    let timer = null;

    if (messages.length === 1 && completion < 100 && blindSpots.length > 0) {
      const spot = blindSpots[0];
      timer = setTimeout(() => {
        if (mountedRef.current) {
          const nudgeText = "שלום שוב. סרקתי את דוח המודיעין שלך וראיתי שאנחנו עדיין עיוורים בחזית ה**" + spot.blindSpot + "**. בלי המידע הזה, האסטרטגיה שלנו לכיבוש היעדים שלך בסכנה. האם נסיר את ערפל הקרב הזה עכשיו?";
          setMessages(prev => [...prev, { id: nextId(), role: 'assistant', text: nudgeText }]);
        }
      }, 1500);
    }

    return () => {
      mountedRef.current = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const send = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: nextId(), role: 'user', text };
    setInput('');
    setLoading(true);

    // הוסף הודעת משתמש + הודעת AI ריקה שתתמלא בזמן אמת
    const partialId = nextId();
    setMessages(prev => [
      ...prev,
      userMsg,
      { id: partialId, role: 'assistant', text: '' },
    ]);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (USE_AGENT_TEAM) {
        // Multi-agent path — show stage progress, then final synthesis
        const { response } = await askTeam(text, mockUser, (progress) => {
          if (!mountedRef.current) return;
          let stageText = '';
          if (progress.stage === 'routing')      stageText = '🎭 מנתב לסוכנים...';
          if (progress.stage === 'thinking')     stageText = `🧠 ${progress.agents.length} סוכנים חושבים...`;
          if (progress.stage === 'agent_done')   stageText = `✓ ${progress.agent} סיים`;
          if (progress.stage === 'synthesizing') stageText = '✨ מאחד תובנות...';
          setMessages(prev =>
            prev.map(m => m.id === partialId ? { ...m, text: stageText } : m)
          );
          flatListRef.current?.scrollToEnd({ animated: false });
        });
        if (mountedRef.current) {
          setMessages(prev =>
            prev.map(m => m.id === partialId ? { ...m, text: response } : m)
          );
        }
      } else {
        await chatWithAI(text, mockUser, (partial) => {
          if (!mountedRef.current) return;
          setMessages(prev =>
            prev.map(m => m.id === partialId ? { ...m, text: partial } : m)
          );
          flatListRef.current?.scrollToEnd({ animated: false });
        });
      }
    } catch (error) {
      let errorMsg = 'שגיאת חיבור — Ollama לא זמין. VerMillion עובד במצב דמו.';
      if (error?.message?.includes('Network request failed')) {
        errorMsg = `שגיאת חיבור — לא מגיע ל-${CONFIG.OLLAMA_BASE_URL}. VerMillion עובד במצב דמו.`;
      }
      if (mountedRef.current) {
        setMessages(prev =>
          prev.map(m => m.id === partialId ? { ...m, text: errorMsg } : m)
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>V</Text></View>
        <View>
          <Text style={styles.aiName}>VerMillion AI</Text>
          <Text style={[
            styles.aiStatus,
            aiOnline === null && { color: '#666' },
            aiOnline === true  && { color: '#4CAF50' },
            aiOnline === false && { color: '#F39C12' },
          ]}>
            {aiOnline === null ? '● מתחבר...' : aiOnline ? '● Online' : '● מצב דמו'}
          </Text>
        </View>
      </View>

      {completion < 60 && (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={() => navigation.navigate('DailyQuestions')}
        >
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningText}>
            <Text style={styles.warningTitle}>
              הפרופיל שלך {completion}% — הייעוץ חלקי
            </Text>
            <Text style={styles.warningSub}>
              {blindSpots.length} נושאים שאני לא יכול לייעץ עליהם · השלם →
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Bubble message={item} />}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={loading && messages[messages.length - 1]?.text === '' ? (
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>VerMillion מנתח...</Text>
          </View>
        ) : null}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t.aiPlaceholder}
          placeholderTextColor="#444"
          value={input}
          onChangeText={setInput}
          multiline
          textAlign="right"
          onSubmitEditing={() => send(input)}
        />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => send(input)} disabled={!input.trim()}>
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const ERROR_PHRASES = ['תקלה', 'Ollama', 'שגיאה', 'לא מצליח'];

function Bubble({ message }) {
  const isUser = message.role === 'user';
  const isError = !isUser && ERROR_PHRASES.some(p => message.text?.includes(p));
  const completion = calcCompletion(mockUser.dailyAnswers || {});

  let borderColor = '#1A1A1A';
  if (!isUser && !isError) {
    if (completion < 40) borderColor = '#444';
    else if (completion < 90) borderColor = '#C0392B44';
    else borderColor = '#D4AF37';
  }
  if (isError) borderColor = '#F39C1266';

  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={isUser ? styles.boldTextUser : styles.boldTextBot}>
            {part.replace(/\*\*/g, '')}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.bubbleContainerUser : styles.bubbleContainerBot]}>
      {!isUser && (
        <View style={styles.miniAvatar}>
          <Text style={styles.miniAvatarText}>V</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : isError ? styles.bubbleError : styles.bubbleBot,
        !isUser && { borderWidth: 1.5, borderColor: borderColor }
      ]}>
        {isError && <Text style={styles.errorTag}>⚠️ שגיאת חיבור</Text>}
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {renderText(message.text)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 20, 
    paddingTop: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#0A0A0A',
    zIndex: 10
  },
  aiAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#C0392B', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 8, 
    shadowColor: '#C0392B', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#FF4D4D'
  },
  aiAvatarText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  aiName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  aiStatus: { color: '#4CAF50', fontSize: 12, fontWeight: '500' },
  messages: { padding: 16, paddingBottom: 24 },
  bubbleContainer: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  bubbleContainerUser: { justifyContent: 'flex-end' },
  bubbleContainerBot: { justifyContent: 'flex-start' },
  miniAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 2, borderWidth: 1, borderColor: '#FF4D4D44' },
  miniAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  bubble: { 
    maxWidth: '80%', 
    borderRadius: 22, 
    paddingHorizontal: 18, 
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  bubbleBot: { backgroundColor: '#1A1A1A', borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#C0392B', borderBottomRightRadius: 4 },
  bubbleError: { backgroundColor: '#1A0E00', borderBottomLeftRadius: 4 },
  errorTag: { color: '#F39C12', fontSize: 11, fontWeight: '700', marginBottom: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22, textAlign: 'right' },
  bubbleTextBot: { color: '#E0E0E0' },
  bubbleTextUser: { color: '#FFFFFF', fontWeight: '500' },
  boldTextBot: { color: '#C0392B', fontWeight: '800' },
  boldTextUser: { color: '#FFFFFF', fontWeight: '800', textDecorationLine: 'underline' },
  typingBubble: { 
    backgroundColor: '#1A1A1A', 
    alignSelf: 'flex-start', 
    borderRadius: 18, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginLeft: 36,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C0392B44'
  },
  typingText: { color: '#C0392B', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 12, 
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    gap: 10, 
    borderTopWidth: 1, 
    borderTopColor: '#1A1A1A',
    backgroundColor: '#0A0A0A'
  },
  input: { 
    flex: 1, 
    backgroundColor: '#161616', 
    borderRadius: 24, 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    color: '#FFFFFF', 
    fontSize: 15, 
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#222'
  },
  sendBtn: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: '#C0392B', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  sendBtnDisabled: { backgroundColor: '#222' },
  sendBtnText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  warningBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#1A0E00', 
    borderBottomWidth: 1, 
    borderBottomColor: '#2A1A00', 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  warningIcon: { fontSize: 16 },
  warningText: { flex: 1 },
  warningTitle: { color: '#F39C12', fontSize: 13, fontWeight: '700' },
  warningSub: { color: '#7A5A20', fontSize: 11, marginTop: 2 },
});
