export const translations = {
  he: {
    // ─── Club / App ───
    clubName: 'שקל למיליון',
    appName: 'VERMILLION',
    currency: 'שקל',
    currencySymbol: '₪',

    // ─── Welcome ───
    tagline: 'מיומנות היא לא מזל',
    heroTitle: 'מיומנות\nשווה כסף.',
    heroSub: 'לא מזל. לא הגרלה.\nרק הדיוק שלך מול כולם.',
    continueGoogle: 'המשך עם Google',
    continuePhone: 'המשך עם מספר טלפון',
    alreadyMember: 'כבר חבר?',
    login: 'כניסה',
    legalText: 'בהמשך אתה מסכים לתנאי השימוש ומדיניות הפרטיות',
    or: 'או',

    // ─── Stats ───
    stat1Value: '35K+', stat1Label: 'משתתפים',
    stat2Label: 'פרס חודשי',
    stat3Value: '99.1%', stat3Label: 'דיוק מקסימלי',

    // ─── CompleteProfile ───
    cpBack: '← חזרה',
    cpStepLabel: 'שלב 1 מתוך 3 — פרטים אישיים',
    cpTitle: 'ספר לנו\nעליך',
    cpSubtitle: 'לצורך אימות זהות. מוצפן ומאובטח.',
    cpFirstName: 'שם פרטי',
    cpLastName: 'שם משפחה',
    cpFirstNamePh: 'ישראל',
    cpLastNamePh: 'ישראלי',
    cpDob: 'תאריך לידה',
    cpDobErr1: 'הכנס תאריך לידה מלא',
    cpDobErr2: 'תאריך לידה לא תקין',
    cpIdLabel: 'ת.ז / מספר דרכון',
    cpIdHint: 'דרכון או תעודת זהות לאומית',
    cpIdError: 'נדרש מספר ת.ז / דרכון',
    cpPhoneLabel: 'מספר טלפון',
    cpPhoneError: 'הכנס מספר טלפון תקין',
    cpCountryTitle: 'בחר מדינה',
    cpPrivacy: 'המידע שלך מוצפן מקצה לקצה. ת.ז משמש לאימות חד-פעמי בלבד ולא נמסר לאף גורם.',
    cpSubmit: 'המשך — בנה את ה-VerMillion שלך →',
    cpSaving: 'שומר...',

    // ─── Old Profile fields (kept for backward compat) ───
    stepLabel: 'שלב 2 מתוך 3 — פרטים אישיים',
    profileTitle: 'ספר לנו\nעליך',
    profileSub: 'המידע משמש לאימות זהות ולשמירה על הוגנות המשחק',
    fieldFirstName: 'שם פרטי',
    fieldLastName: 'שם משפחה',
    fieldId: 'מספר תעודת זהות',
    fieldPhone: 'מספר טלפון',
    privacyNote: 'הפרטים שלך מוצפנים ומאובטחים. מספר ת.ז משמש לאימות חד פעמי בלבד.',
    submitProfile: 'המשך לאימות טלפון ←',
    creating: 'יוצר חשבון...',
    errFirstName: 'שם פרטי חובה',
    errLastName: 'שם משפחה חובה',
    errId: 'ת.ז חייבת להיות 9 ספרות',
    errPhone: 'מספר טלפון לא תקין',

    // ─── Avatar Appearance ───
    avatarStepBadge: 'מראה האווטר',
    avatarHintEmpty: 'ענה על השאלות כדי לבנות את הדמות שלך',
    avatarBack: '←',
    avatarQuestions: [
      {
        key: 'body',
        question: 'מה הגוף של ה-VerMillion שלך?',
        options: [
          { value: 'slim',     emoji: '🧍', label: 'רזה ומהיר'    },
          { value: 'athletic', emoji: '💪', label: 'חטוב וחזק'    },
          { value: 'heavy',    emoji: '🗿', label: 'כבד ויציב'    },
        ],
      },
      {
        key: 'style',
        question: 'מה הסגנון שלו?',
        options: [
          { value: 'warrior', emoji: '⚔️', label: 'לוחם'         },
          { value: 'sage',    emoji: '🧠', label: 'חכם ומסתורי'  },
          { value: 'royal',   emoji: '👑', label: 'מלוכותי'      },
          { value: 'street',  emoji: '🔥', label: 'רחוב ועוצמתי' },
        ],
      },
      {
        key: 'colors',
        question: 'הצבעים שלו?',
        options: [
          { value: 'dark',     emoji: '🖤', label: 'כהה ומסתורי'  },
          { value: 'gold',     emoji: '✨', label: 'זהוב ומלכותי' },
          { value: 'fire',     emoji: '🔴', label: 'אש ואדום'     },
          { value: 'colorful', emoji: '🌈', label: 'צבעוני ובולט' },
        ],
      },
      {
        key: 'energy',
        question: 'האנרגיה שלו?',
        options: [
          { value: 'calm',     emoji: '🧘', label: 'רגוע ומרוכז'  },
          { value: 'intense',  emoji: '⚡', label: 'עצים ומהיר'   },
          { value: 'wise',     emoji: '🌙', label: 'חכם ועמוק'    },
          { value: 'playful',  emoji: '😈', label: 'שובב ועצמאי'  },
        ],
      },
    ],

    // ─── Avatar Tone ───
    toneStepBadge: 'אישיות היועץ',
    toneQuestions: [
      {
        key: 'advice_style',
        question: 'איך אתה אוהב לקבל עצות?',
        options: [
          { value: 'direct', emoji: '🎯', label: 'ישיר וקצר',      desc: 'תגיד לי מה לעשות, בלי סיבוכים' },
          { value: 'gentle', emoji: '🤝', label: 'עדין ומסביר',     desc: 'הסבר לי למה, סבלנות' },
          { value: 'tough',  emoji: '⚡', label: 'לחץ עלי',         desc: 'אל תרחם, תדחוף אותי קדימה' },
        ],
      },
      {
        key: 'personality',
        question: 'מה הסגנון של היועץ שלך?',
        options: [
          { value: 'serious',  emoji: '🧠', label: 'רציני ועסקי',  desc: 'נתונים, מספרים, עובדות' },
          { value: 'friendly', emoji: '😊', label: 'חבר טוב',       desc: 'חם, תומך, מעודד' },
          { value: 'mentor',   emoji: '🏆', label: 'מנטור קשוח',   desc: 'גבוה הסטנדרטים, לא מתפשר' },
        ],
      },
      {
        key: 'goal_focus',
        question: 'מה הכי חשוב לך?',
        options: [
          { value: 'money',   emoji: '💰', label: 'להרוויח יותר כסף', desc: 'השקעות, הכנסה, עושר' },
          { value: 'freedom', emoji: '🕊️', label: 'חופש כלכלי',       desc: 'לצאת מחובות, להיות עצמאי' },
          { value: 'growth',  emoji: '📈', label: 'לצמוח כאדם',       desc: 'הרגלים, משמעת, השקפה' },
        ],
      },
    ],

    // ─── Avatar Intro (Day 1 questions) ───
    introStepBadge: 'היכרות ראשונה',
    introProgressLabel: (n, total) => `שאלה ${n} מתוך ${total}`,
    introNextBtn: 'הבא ←',
    introRevealBtn: 'בואו נראה את ה-VerMillion שלך ▶',
    introQuestions: [
      { key: 'occupation', question: 'מה אתה עושה לפרנסה?',        placeholder: 'מהנדס, עצמאי, סטודנט...' },
      { key: 'status',     question: 'מה המצב המשפחתי שלך?',       placeholder: 'רווק / נשוי / זוגי...'    },
      { key: 'city',       question: 'באיזו עיר / מדינה אתה גר?',  placeholder: 'תל אביב, ניו יורק...'     },
    ],

    // ─── Daily Questions ───
    dqQuestion: (n, total) => `שאלה ${n} מתוך ${total}`,
    dqDayLabel: (day, topic) => `יום ${day} — ${topic}`,
    dqOptional: 'אופציונלי',
    dqNext: 'הבא ←',
    dqFinish: 'סיים ועבור לאתגר ▶',
    dqLeaveBlank: 'אשאיר חסר ▾',
    dqSkipTitle: 'רגע לפני שמדלגים',
    dqSkipBody: (blindSpot) =>
      `בלי המידע הזה, VerMillion\nלא יוכל לייעץ לך על\n${blindSpot || 'נושא זה'}.\n\nהעצה שיתן תהיה כללית — לא מותאמת לך אישית.`,
    dqSkipConfirm: 'אשאיר חסר',
    dqSkipCancel: 'אענה עכשיו',
    dqBlindSpotPrefix: 'ללא מידע זה: VerMillion לא יוכל לייעץ על ',
    dqDocChoose: 'בחר קובץ',
    dqDocSub: 'PDF, JPG, PNG — עד 20MB',
    dqUploading: 'מעלה...',
    dqShareLater: 'אשתף בהמשך',
    dqNoQuestions: 'אין שאלות להיום',
    dqToChallenge: 'עבור לאתגר →',
    dqDoneTitle: 'תודה!',
    dqDoneSub: 'VerMillion עיבד את התשובות שלך.',
    dqDoneCompLabel: 'הפרופיל שלך הושלם על',
    dqDoneBtn: 'לאתגר היומי ▶',

    // ─── Home ───
    greeting: (name) => `שלום, ${name} 👋`,
    onboardingTitle: 'שבוע ההצטרפות',
    onboardingDaysLeft: (n) => `עוד ${n} ימים`,
    challengeLabel: '🎯 אתגר היום',
    challengeTitle: 'מרוץ המכשולים',
    challengeSub: 'השלם את המשחק ← לחץ בדיוק בזמן האישי שלך',
    attempts: (n) => `${n} ניסיונות`,
    playBtn: 'שחק ▶',
    rankLabel: 'דירוג',
    streakLabel: 'רצף',
    accuracyLabel: 'דיוק',
    prizePoolTitle: 'קרן הפרסים',
    seeFullRank: 'ראה דירוג מלא ←',
    askAI: 'שאל אותי כל שאלה על המשחק →',

    // ─── Leaderboard ───
    leaderboardTitle: 'דירוג',
    myRank: 'הדירוג שלי',

    // ─── AI Coach ───
    aiGreeting: 'שלום! אני VerMillion AI — המאמן האישי שלך. אני כאן לעזור לך לשפר את המיומנות, לנהל כסף בצורה חכמה, ולנצח בתחרות. במה אוכל לעזור?',
    aiPlaceholder: 'שאל אותי משהו...',
    aiSuggestions: [
      'איך אני יכול לשפר את הדיוק שלי?',
      'תן לי תכנית חיסכון ל-3 חודשים',
      'מה הדרך הטובה ביותר לנצח?',
    ],

    // ─── Challenge ───
    challengeGameType: 'מרוץ המכשולים',
    firstTimeTitle: 'הפעם הראשונה שלך 🎯',
    firstTimeText: 'לאחר המשחק, תלחץ על כפתור.\nהרגע שתלחץ — יהיה הזמן האישי שלך לתמיד.\n\nמחר ובכל יום — תצטרך ללחוץ בדיוק באותו רגע.',
    personalTimeLabel: 'הזמן האישי שלך',
    startGame: '▶ התחל משחק',
    stampBtn: 'חתום את הזמן שלי',
    setTimeBtn: 'קבע את הזמן האישי שלי',
    gameDone: '✓ המשחק הסתיים',
    waitForMoment: 'עכשיו חכה לרגע שלך',
    pressNow: 'לחץ עכשיו — זה יהיה הזמן שלך!',
    nowTime: 'השעה עכשיו',
    timeSetTitle: 'הזמן האישי שלך נקבע! 🎯',
    yourTime: 'הזמן שלך',
    timeSetNote: 'זה הזמן שתצטרך לחזור אליו כל יום.\nמחר — נראה כמה אתה מדויק.',
    resultLabel: 'התוצאה שלך',
    accuracyScore: 'ציון דיוק',
    diffMs: (n) => `הפרש: ${n.toLocaleString()} מילישניות`,
    tryAgain: 'נסה שוב',
    back: '← חזור',
  },

  // ─────────────────────────────────────────────
  en: {
    // ─── Club / App ───
    clubName: 'Dollar to a Million',
    appName: 'VERMILLION',
    currency: 'Dollar',
    currencySymbol: '$',

    // ─── Welcome ───
    tagline: 'Skill is not luck',
    heroTitle: 'Skill\nPays.',
    heroSub: 'No luck. No lottery.\nJust your precision vs. everyone.',
    continueGoogle: 'Continue with Google',
    continuePhone: 'Continue with phone number',
    alreadyMember: 'Already a member?',
    login: 'Sign in',
    legalText: 'By continuing you agree to our Terms of Service and Privacy Policy',
    or: 'or',

    // ─── Stats ───
    stat1Value: '35K+', stat1Label: 'Players',
    stat2Label: 'Monthly prize',
    stat3Value: '99.1%', stat3Label: 'Top accuracy',

    // ─── CompleteProfile ───
    cpBack: '← Back',
    cpStepLabel: 'Step 1 of 3 — Personal Details',
    cpTitle: 'Tell us\nabout you',
    cpSubtitle: 'Used for identity verification. Encrypted & secure.',
    cpFirstName: 'First Name',
    cpLastName: 'Last Name',
    cpFirstNamePh: 'John',
    cpLastNamePh: 'Smith',
    cpDob: 'Date of Birth',
    cpDobErr1: 'Enter your full date of birth',
    cpDobErr2: 'Invalid date of birth',
    cpIdLabel: 'ID / Passport Number',
    cpIdHint: 'Passport or national ID',
    cpIdError: 'ID / Passport number required',
    cpPhoneLabel: 'Phone Number',
    cpPhoneError: 'Enter a valid phone number',
    cpCountryTitle: 'Select Country',
    cpPrivacy: 'Your data is encrypted end-to-end. ID is used for one-time verification only and never shared.',
    cpSubmit: 'Continue — Build Your VerMillion →',
    cpSaving: 'Saving...',

    // ─── Old Profile fields ───
    stepLabel: 'Step 2 of 3 — Personal details',
    profileTitle: 'Tell us\nabout you',
    profileSub: 'Your info is used for identity verification and fair play',
    fieldFirstName: 'First name',
    fieldLastName: 'Last name',
    fieldId: 'ID number',
    fieldPhone: 'Phone number',
    privacyNote: 'Your details are encrypted. ID is used for one-time verification only.',
    submitProfile: 'Continue to phone verification →',
    creating: 'Creating account...',
    errFirstName: 'First name is required',
    errLastName: 'Last name is required',
    errId: 'ID must be 9 digits',
    errPhone: 'Invalid phone number',

    // ─── Avatar Appearance ───
    avatarStepBadge: 'Avatar Appearance',
    avatarHintEmpty: 'Answer the questions to build your character',
    avatarBack: '←',
    avatarQuestions: [
      {
        key: 'body',
        question: 'What body type is your VerMillion?',
        options: [
          { value: 'slim',     emoji: '🧍', label: 'Slim & Fast'      },
          { value: 'athletic', emoji: '💪', label: 'Athletic & Strong' },
          { value: 'heavy',    emoji: '🗿', label: 'Heavy & Steady'    },
        ],
      },
      {
        key: 'style',
        question: 'What is their style?',
        options: [
          { value: 'warrior', emoji: '⚔️', label: 'Warrior'         },
          { value: 'sage',    emoji: '🧠', label: 'Wise & Mysterious' },
          { value: 'royal',   emoji: '👑', label: 'Royal'            },
          { value: 'street',  emoji: '🔥', label: 'Street & Power'   },
        ],
      },
      {
        key: 'colors',
        question: 'Their color palette?',
        options: [
          { value: 'dark',     emoji: '🖤', label: 'Dark & Mysterious' },
          { value: 'gold',     emoji: '✨', label: 'Gold & Royal'      },
          { value: 'fire',     emoji: '🔴', label: 'Fire & Red'        },
          { value: 'colorful', emoji: '🌈', label: 'Vibrant & Bold'    },
        ],
      },
      {
        key: 'energy',
        question: 'Their energy?',
        options: [
          { value: 'calm',    emoji: '🧘', label: 'Calm & Focused'  },
          { value: 'intense', emoji: '⚡', label: 'Intense & Fast'   },
          { value: 'wise',    emoji: '🌙', label: 'Wise & Deep'      },
          { value: 'playful', emoji: '😈', label: 'Playful & Fierce' },
        ],
      },
    ],

    // ─── Avatar Tone ───
    toneStepBadge: 'Advisor Personality',
    toneQuestions: [
      {
        key: 'advice_style',
        question: 'How do you like to receive advice?',
        options: [
          { value: 'direct', emoji: '🎯', label: 'Direct & Brief',    desc: 'Tell me what to do, no fluff' },
          { value: 'gentle', emoji: '🤝', label: 'Gentle & Explained', desc: 'Explain why, be patient' },
          { value: 'tough',  emoji: '⚡', label: 'Push me hard',       desc: 'No mercy, push me forward' },
        ],
      },
      {
        key: 'personality',
        question: 'What style of advisor?',
        options: [
          { value: 'serious',  emoji: '🧠', label: 'Serious & Business', desc: 'Data, numbers, facts' },
          { value: 'friendly', emoji: '😊', label: 'Good Friend',         desc: 'Warm, supportive, encouraging' },
          { value: 'mentor',   emoji: '🏆', label: 'Tough Mentor',        desc: 'High standards, no compromise' },
        ],
      },
      {
        key: 'goal_focus',
        question: 'What matters most to you?',
        options: [
          { value: 'money',   emoji: '💰', label: 'Earn more money',    desc: 'Investments, income, wealth' },
          { value: 'freedom', emoji: '🕊️', label: 'Financial freedom',  desc: 'Get out of debt, be independent' },
          { value: 'growth',  emoji: '📈', label: 'Grow as a person',   desc: 'Habits, discipline, mindset' },
        ],
      },
    ],

    // ─── Avatar Intro (Day 1 questions) ───
    introStepBadge: 'First Introduction',
    introProgressLabel: (n, total) => `Question ${n} of ${total}`,
    introNextBtn: 'Next →',
    introRevealBtn: "Let's see your VerMillion ▶",
    introQuestions: [
      { key: 'occupation', question: 'What do you do for a living?',       placeholder: 'Engineer, freelancer, student...' },
      { key: 'status',     question: 'What is your relationship status?',   placeholder: 'Single / Married / In a relationship...' },
      { key: 'city',       question: 'Which city / country do you live in?', placeholder: 'New York, London...' },
    ],

    // ─── Daily Questions ───
    dqQuestion: (n, total) => `Question ${n} of ${total}`,
    dqDayLabel: (day, topic) => `Day ${day} — ${topic}`,
    dqOptional: 'Optional',
    dqNext: 'Next →',
    dqFinish: 'Finish & go to challenge ▶',
    dqLeaveBlank: 'Leave blank ▾',
    dqSkipTitle: 'Before you skip',
    dqSkipBody: (blindSpot) =>
      `Without this info, VerMillion\ncannot advise you on\n${blindSpot || 'this topic'}.\n\nThe advice will be generic — not tailored to you.`,
    dqSkipConfirm: 'Leave blank',
    dqSkipCancel: 'Answer now',
    dqBlindSpotPrefix: 'Without this: VerMillion cannot advise on ',
    dqDocChoose: 'Choose file',
    dqDocSub: 'PDF, JPG, PNG — up to 20MB',
    dqUploading: 'Uploading...',
    dqShareLater: 'Share later',
    dqNoQuestions: 'No questions for today',
    dqToChallenge: 'Go to challenge →',
    dqDoneTitle: 'Thank you!',
    dqDoneSub: 'VerMillion processed your answers.',
    dqDoneCompLabel: 'Your profile is',
    dqDoneBtn: 'Daily challenge ▶',

    // ─── Home ───
    greeting: (name) => `Hey, ${name} 👋`,
    onboardingTitle: 'Trial week',
    onboardingDaysLeft: (n) => `${n} days left`,
    challengeLabel: "🎯 Today's challenge",
    challengeTitle: 'Obstacle Race',
    challengeSub: 'Finish the game → Press at your personal time',
    attempts: (n) => `${n} attempts`,
    playBtn: 'Play ▶',
    rankLabel: 'Rank',
    streakLabel: 'Streak',
    accuracyLabel: 'Accuracy',
    prizePoolTitle: 'Prize Pool',
    seeFullRank: 'See full leaderboard →',
    askAI: 'Ask me anything about the game →',

    // ─── Leaderboard ───
    leaderboardTitle: 'Leaderboard',
    myRank: 'My rank',

    // ─── AI Coach ───
    aiGreeting: "Hey! I'm VerMillion AI — your personal coach. I'm here to help you improve your precision, manage money wisely, and win. How can I help?",
    aiPlaceholder: 'Ask me something...',
    aiSuggestions: [
      'How can I improve my accuracy?',
      'Give me a 3-month savings plan',
      "What's the best strategy to win?",
    ],

    // ─── Challenge ───
    challengeGameType: 'Obstacle Race',
    firstTimeTitle: 'Your first time 🎯',
    firstTimeText: 'After the game, press the button.\nThe moment you press — becomes your personal time forever.\n\nTomorrow and every day — you must press at that exact moment.',
    personalTimeLabel: 'Your personal time',
    startGame: '▶ Start game',
    stampBtn: 'Stamp my time',
    setTimeBtn: 'Set my personal time',
    gameDone: '✓ Game complete',
    waitForMoment: 'Now wait for your moment',
    pressNow: 'Press now — this will be your time!',
    nowTime: 'Current time',
    timeSetTitle: 'Your personal time is set! 🎯',
    yourTime: 'Your time',
    timeSetNote: "This is the time you must return to every day.\nTomorrow — we'll see how precise you are.",
    resultLabel: 'Your result',
    accuracyScore: 'Accuracy score',
    diffMs: (n) => `Diff: ${n.toLocaleString()} milliseconds`,
    tryAgain: 'Try again',
    back: '← Back',
  },

  // ─────────────────────────────────────────────
  ru: {
    // ─── Club / App ───
    clubName: 'Рубль к миллиону',
    appName: 'VERMILLION',
    currency: 'Рубль',
    currencySymbol: '₽',

    // ─── Welcome ───
    tagline: 'Мастерство — не удача',
    heroTitle: 'Мастерство\nстоит денег.',
    heroSub: 'Никакой удачи. Никакой лотереи.\nТолько твоя точность против всех.',
    continueGoogle: 'Продолжить с Google',
    continuePhone: 'Продолжить с номером телефона',
    alreadyMember: 'Уже участник?',
    login: 'Войти',
    legalText: 'Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности',
    or: 'или',

    // ─── Stats ───
    stat1Value: '35K+', stat1Label: 'Участников',
    stat2Label: 'Ежемес. приз',
    stat3Value: '99.1%', stat3Label: 'Макс. точность',

    // ─── CompleteProfile ───
    cpBack: '← Назад',
    cpStepLabel: 'Шаг 1 из 3 — Личные данные',
    cpTitle: 'Расскажите\nо себе',
    cpSubtitle: 'Для верификации личности. Зашифровано и защищено.',
    cpFirstName: 'Имя',
    cpLastName: 'Фамилия',
    cpFirstNamePh: 'Иван',
    cpLastNamePh: 'Иванов',
    cpDob: 'Дата рождения',
    cpDobErr1: 'Введите полную дату рождения',
    cpDobErr2: 'Неверная дата рождения',
    cpIdLabel: 'Паспорт / Номер удостоверения',
    cpIdHint: 'Паспорт или национальное удостоверение',
    cpIdError: 'Необходим номер паспорта / удостоверения',
    cpPhoneLabel: 'Номер телефона',
    cpPhoneError: 'Введите верный номер телефона',
    cpCountryTitle: 'Выберите страну',
    cpPrivacy: 'Ваши данные зашифрованы. Паспорт используется только для одноразовой верификации и никому не передаётся.',
    cpSubmit: 'Далее — Создай своего VerMillion →',
    cpSaving: 'Сохранение...',

    // ─── Old Profile fields ───
    stepLabel: 'Шаг 2 из 3 — Личные данные',
    profileTitle: 'Расскажите\nо себе',
    profileSub: 'Данные используются для верификации и честной игры',
    fieldFirstName: 'Имя',
    fieldLastName: 'Фамилия',
    fieldId: 'Номер паспорта',
    fieldPhone: 'Номер телефона',
    privacyNote: 'Ваши данные зашифрованы. Паспорт используется только для одноразовой верификации.',
    submitProfile: 'Продолжить →',
    creating: 'Создание аккаунта...',
    errFirstName: 'Имя обязательно',
    errLastName: 'Фамилия обязательна',
    errId: 'Паспорт должен содержать 9 цифр',
    errPhone: 'Неверный номер телефона',

    // ─── Avatar Appearance ───
    avatarStepBadge: 'Внешность аватара',
    avatarHintEmpty: 'Отвечай на вопросы, чтобы создать своего персонажа',
    avatarBack: '←',
    avatarQuestions: [
      {
        key: 'body',
        question: 'Какое телосложение у твоего VerMillion?',
        options: [
          { value: 'slim',     emoji: '🧍', label: 'Стройный и быстрый'  },
          { value: 'athletic', emoji: '💪', label: 'Атлетичный и сильный' },
          { value: 'heavy',    emoji: '🗿', label: 'Крупный и устойчивый' },
        ],
      },
      {
        key: 'style',
        question: 'Каков его стиль?',
        options: [
          { value: 'warrior', emoji: '⚔️', label: 'Воин'              },
          { value: 'sage',    emoji: '🧠', label: 'Мудрый и таинственный' },
          { value: 'royal',   emoji: '👑', label: 'Королевский'       },
          { value: 'street',  emoji: '🔥', label: 'Улица и сила'      },
        ],
      },
      {
        key: 'colors',
        question: 'Его цветовая палитра?',
        options: [
          { value: 'dark',     emoji: '🖤', label: 'Тёмный и таинственный' },
          { value: 'gold',     emoji: '✨', label: 'Золотой и королевский'  },
          { value: 'fire',     emoji: '🔴', label: 'Огонь и красный'        },
          { value: 'colorful', emoji: '🌈', label: 'Яркий и заметный'       },
        ],
      },
      {
        key: 'energy',
        question: 'Его энергия?',
        options: [
          { value: 'calm',    emoji: '🧘', label: 'Спокойный и сосредоточенный' },
          { value: 'intense', emoji: '⚡', label: 'Интенсивный и быстрый'       },
          { value: 'wise',    emoji: '🌙', label: 'Мудрый и глубокий'           },
          { value: 'playful', emoji: '😈', label: 'Игривый и независимый'       },
        ],
      },
    ],

    // ─── Avatar Tone ───
    toneStepBadge: 'Личность советника',
    toneQuestions: [
      {
        key: 'advice_style',
        question: 'Как ты любишь получать советы?',
        options: [
          { value: 'direct', emoji: '🎯', label: 'Прямо и коротко',    desc: 'Скажи что делать, без лишнего' },
          { value: 'gentle', emoji: '🤝', label: 'Мягко и с объяснением', desc: 'Объясни почему, с терпением' },
          { value: 'tough',  emoji: '⚡', label: 'Давит на меня',       desc: 'Без пощады, толкай вперёд' },
        ],
      },
      {
        key: 'personality',
        question: 'Какой стиль советника?',
        options: [
          { value: 'serious',  emoji: '🧠', label: 'Серьёзный и деловой', desc: 'Данные, цифры, факты' },
          { value: 'friendly', emoji: '😊', label: 'Хороший друг',         desc: 'Тёплый, поддерживающий' },
          { value: 'mentor',   emoji: '🏆', label: 'Строгий наставник',    desc: 'Высокие стандарты, без компромиссов' },
        ],
      },
      {
        key: 'goal_focus',
        question: 'Что для тебя важнее всего?',
        options: [
          { value: 'money',   emoji: '💰', label: 'Зарабатывать больше',     desc: 'Инвестиции, доход, богатство' },
          { value: 'freedom', emoji: '🕊️', label: 'Финансовая свобода',     desc: 'Выйти из долгов, быть независимым' },
          { value: 'growth',  emoji: '📈', label: 'Расти как личность',      desc: 'Привычки, дисциплина, мышление' },
        ],
      },
    ],

    // ─── Avatar Intro (Day 1 questions) ───
    introStepBadge: 'Первое знакомство',
    introProgressLabel: (n, total) => `Вопрос ${n} из ${total}`,
    introNextBtn: 'Далее →',
    introRevealBtn: 'Посмотрим твоего VerMillion ▶',
    introQuestions: [
      { key: 'occupation', question: 'Чем ты зарабатываешь на жизнь?',   placeholder: 'Инженер, фрилансер, студент...' },
      { key: 'status',     question: 'Каков твой семейный статус?',       placeholder: 'Одинок / Женат / В отношениях...' },
      { key: 'city',       question: 'В каком городе / стране ты живёшь?', placeholder: 'Москва, Нью-Йорк...' },
    ],

    // ─── Daily Questions ───
    dqQuestion: (n, total) => `Вопрос ${n} из ${total}`,
    dqDayLabel: (day, topic) => `День ${day} — ${topic}`,
    dqOptional: 'Необязательно',
    dqNext: 'Далее →',
    dqFinish: 'Завершить и перейти к заданию ▶',
    dqLeaveBlank: 'Пропустить ▾',
    dqSkipTitle: 'Перед тем как пропустить',
    dqSkipBody: (blindSpot) =>
      `Без этой информации VerMillion\nне сможет советовать по теме\n${blindSpot || 'этой темы'}.\n\nСовет будет общим — не персонализированным.`,
    dqSkipConfirm: 'Пропустить',
    dqSkipCancel: 'Ответить сейчас',
    dqBlindSpotPrefix: 'Без этого: VerMillion не сможет советовать по ',
    dqDocChoose: 'Выбрать файл',
    dqDocSub: 'PDF, JPG, PNG — до 20МБ',
    dqUploading: 'Загрузка...',
    dqShareLater: 'Поделюсь позже',
    dqNoQuestions: 'Нет вопросов на сегодня',
    dqToChallenge: 'Перейти к заданию →',
    dqDoneTitle: 'Спасибо!',
    dqDoneSub: 'VerMillion обработал твои ответы.',
    dqDoneCompLabel: 'Твой профиль заполнен на',
    dqDoneBtn: 'Ежедневное задание ▶',

    // ─── Home ───
    greeting: (name) => `Привет, ${name} 👋`,
    onboardingTitle: 'Пробная неделя',
    onboardingDaysLeft: (n) => `Ещё ${n} дней`,
    challengeLabel: '🎯 Задание дня',
    challengeTitle: 'Гонка с препятствиями',
    challengeSub: 'Завершите игру → Нажмите в своё личное время',
    attempts: (n) => `${n} попытки`,
    playBtn: 'Играть ▶',
    rankLabel: 'Рейтинг',
    streakLabel: 'Серия',
    accuracyLabel: 'Точность',
    prizePoolTitle: 'Призовой фонд',
    seeFullRank: 'Полный рейтинг →',
    askAI: 'Задай мне любой вопрос →',

    // ─── Leaderboard ───
    leaderboardTitle: 'Рейтинг',
    myRank: 'Мой рейтинг',

    // ─── AI Coach ───
    aiGreeting: 'Привет! Я VerMillion AI — твой личный тренер. Помогу улучшить точность, управлять деньгами и победить. Чем могу помочь?',
    aiPlaceholder: 'Задай вопрос...',
    aiSuggestions: [
      'Как улучшить точность?',
      'Дай план накоплений на 3 месяца',
      'Лучшая стратегия для победы?',
    ],

    // ─── Challenge ───
    challengeGameType: 'Гонка с препятствиями',
    firstTimeTitle: 'Твой первый раз 🎯',
    firstTimeText: 'После игры нажми кнопку.\nМомент нажатия — станет твоим личным временем навсегда.\n\nКаждый день нужно нажимать в этот же момент.',
    personalTimeLabel: 'Твоё личное время',
    startGame: '▶ Начать игру',
    stampBtn: 'Зафиксировать время',
    setTimeBtn: 'Установить личное время',
    gameDone: '✓ Игра завершена',
    waitForMoment: 'Жди своего момента',
    pressNow: 'Нажми сейчас — это станет твоим временем!',
    nowTime: 'Сейчас',
    timeSetTitle: 'Твоё личное время установлено! 🎯',
    yourTime: 'Твоё время',
    timeSetNote: 'Это время ты должен повторять каждый день.\nЗавтра — посмотрим насколько ты точен.',
    resultLabel: 'Твой результат',
    accuracyScore: 'Точность',
    diffMs: (n) => `Разница: ${n.toLocaleString()} мс`,
    tryAgain: 'Попробовать снова',
    back: '← Назад',
  },
};

export const LANGUAGES = [
  { code: 'he', flag: '🇮🇱', name: 'עברית',  rtl: true  },
  { code: 'en', flag: '🇺🇸', name: 'English', rtl: false },
  { code: 'ru', flag: '🇷🇺', name: 'Русский', rtl: false },
];
