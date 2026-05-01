import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated, Modal, FlatList,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { saveProfile, saveFinancialData } from '../../services/storage';
import { markLocalProfileIntakeComplete } from '../../utils/registrationGate';

/* ─── Country codes ─── */
const COUNTRIES = [
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'ישראל'         },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States'  },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Россия'         },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France'         },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Deutschland'    },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canada'         },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia'      },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brasil'         },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India'          },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE'            },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Türkiye'        },
  { code: 'PL', dial: '+48',  flag: '🇵🇱', name: 'Polska'         },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Україна'        },
  { code: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina'      },
];

/* ─── Validation (receives translated error strings) ─── */
function validate(values, t) {
  const e = {};
  if (!values.firstName?.trim())  e.firstName = t.errFirstName;
  if (!values.lastName?.trim())   e.lastName  = t.errLastName;

  const d = parseInt(values.dobD, 10);
  const m = parseInt(values.dobM, 10);
  const y = parseInt(values.dobY, 10);
  if (!values.dobD || !values.dobM || !values.dobY || values.dobY.length < 4) {
    e.dob = t.cpDobErr1;
  } else if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear() - 10) {
    e.dob = t.cpDobErr2;
  }

  if (!values.idNumber?.trim() || values.idNumber.trim().length < 5)
    e.idNumber = t.cpIdError;

  const digits = values.phone?.replace(/\D/g, '') || '';
  if (digits.length < 7) e.phone = t.cpPhoneError;

  return e;
}

/* ─── Country picker modal ─── */
function CountryPicker({ visible, onSelect, onClose, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={cp.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={cp.sheet}>
        <View style={cp.handle} />
        <Text style={cp.sheetTitle}>{title}</Text>
        <FlatList
          data={COUNTRIES}
          keyExtractor={i => i.code}
          renderItem={({ item }) => (
            <TouchableOpacity style={cp.row} onPress={() => { onSelect(item); onClose(); }}>
              <Text style={cp.flag}>{item.flag}</Text>
              <Text style={cp.countryName}>{item.name}</Text>
              <Text style={cp.dialCode}>{item.dial}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

/* ─── Main Screen ─── */
export default function CompleteProfileScreen({ navigation }) {
  const { t } = useLanguage();
  const { user, reloadProfile } = useAuth();
  const [values,  setValues]  = useState({ firstName:'', lastName:'', dobD:'', dobM:'', dobY:'', idNumber:'', phone:'' });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  /* refs for focus chain */
  const refs = {
    firstName: useRef(), lastName: useRef(),
    dobD: useRef(), dobM: useRef(), dobY: useRef(),
    idNumber: useRef(), phone: useRef(),
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const set = (key, val) => {
    setValues(v => ({ ...v, [key]: val }));
    if (touched[key]) {
      const errs = validate({ ...values, [key]: val }, t);
      setErrors(e => ({ ...e, [key]: errs[key], dob: errs.dob }));
    }
  };

  const blur = (key) => {
    setTouched(tv => ({ ...tv, [key]: true }));
    setErrors(validate(values, t));
  };

  /* DOB auto-advance */
  const onDobD = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    set('dobD', clean);
    if (clean.length === 2) refs.dobM.current?.focus();
  };
  const onDobM = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 2);
    set('dobM', clean);
    if (clean.length === 2) refs.dobY.current?.focus();
  };
  const onDobY = (v) => {
    const clean = v.replace(/\D/g, '').slice(0, 4);
    set('dobY', clean);
    if (clean.length === 4) refs.idNumber.current?.focus();
  };

  const submit = () => {
    const allTouched = Object.fromEntries(Object.keys(values).map(k => [k, true]));
    setTouched(allTouched);
    const errs = validate(values, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { shake(); return; }

    setSubmitError('');
    setLoading(true);

    const year  = parseInt(values.dobY, 10);
    const month = parseInt(values.dobM, 10);
    const day   = parseInt(values.dobD, 10);
    const dob   = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;

    const fullName = `${values.firstName} ${values.lastName}`.trim();
    const dateOfBirth = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const phoneDigits = values.phone.replace(/\D/g, '');
    const phoneE164 = `${country.dial}${phoneDigits}`;
    const idDigits = values.idNumber.replace(/\s/g, '');
    const idLast4 = idDigits.slice(-4);
    Promise.all([
      saveProfile({
        name: fullName,
        email: user?.email || undefined,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        phone: phoneE164,
        date_of_birth: dateOfBirth,
        id_number_last4: idLast4,
        onboarding_complete: false,
        profile_intake_complete: true,
      }),
      saveFinancialData({ age }),
    ]).then(async () => {
      markLocalProfileIntakeComplete(user?.id);
      await reloadProfile?.();
      setLoading(false);
      navigation.navigate('AvatarAppearance');
    }).catch(async (e) => {
      console.error('[CompleteProfile] save failed:', e?.message || e);
      setLoading(false);
      setSubmitError('שמירת הפרטים נכשלה. בדקו חיבור ונסו שוב.');
    });
  };

  const allValid = Object.keys(validate(values, t)).length === 0;

  const fieldState = (key) => ({
    hasError: touched[key] && errors[key],
    isValid:  touched[key] && !errors[key] && values[key],
  });

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>{t.cpBack}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.headerBlock}>
          <View style={s.stepRow}>
            {[0,1,2].map(i => (
              <React.Fragment key={i}>
                <View style={[s.stepDot, i === 0 && s.stepDotActive]} />
                {i < 2 && <View style={s.stepLine} />}
              </React.Fragment>
            ))}
          </View>
          <Text style={s.stepLabel}>{t.cpStepLabel}</Text>
          <Text style={s.title}>{t.cpTitle}</Text>
          <Text style={s.subtitle}>{t.cpSubtitle}</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>

          {/* ── Name fields ── */}
          <Field
            label={t.cpFirstName}
            placeholder={t.cpFirstNamePh}
            value={values.firstName}
            onChangeText={v => set('firstName', v)}
            onBlur={() => blur('firstName')}
            {...fieldState('firstName')}
            ref={refs.firstName}
            returnKeyType="next"
            onSubmitEditing={() => refs.lastName.current?.focus()}
          />
          <Field
            label={t.cpLastName}
            placeholder={t.cpLastNamePh}
            value={values.lastName}
            onChangeText={v => set('lastName', v)}
            onBlur={() => blur('lastName')}
            {...fieldState('lastName')}
            ref={refs.lastName}
            returnKeyType="next"
            onSubmitEditing={() => refs.dobD.current?.focus()}
          />

          {/* ── Date of Birth ── */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>{t.cpDob}</Text>
            <View style={[
              s.dobRow,
              touched.dobD && errors.dob  && s.inputWrapError,
              touched.dobD && !errors.dob && s.inputWrapValid,
            ]}>
              <View style={s.dobSegment}>
                <TextInput
                  ref={refs.dobD}
                  style={s.dobInput}
                  value={values.dobD}
                  onChangeText={onDobD}
                  onBlur={() => blur('dobD')}
                  placeholder="DD"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  maxLength={2}
                  textAlign="center"
                  returnKeyType="next"
                />
              </View>
              <Text style={s.dobSep}>/</Text>
              <View style={s.dobSegment}>
                <TextInput
                  ref={refs.dobM}
                  style={s.dobInput}
                  value={values.dobM}
                  onChangeText={onDobM}
                  onBlur={() => blur('dobM')}
                  placeholder="MM"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  maxLength={2}
                  textAlign="center"
                />
              </View>
              <Text style={s.dobSep}>/</Text>
              <View style={[s.dobSegment, { flex: 1.4 }]}>
                <TextInput
                  ref={refs.dobY}
                  style={s.dobInput}
                  value={values.dobY}
                  onChangeText={onDobY}
                  onBlur={() => blur('dobY')}
                  placeholder="YYYY"
                  placeholderTextColor="#333"
                  keyboardType="numeric"
                  maxLength={4}
                  textAlign="center"
                  returnKeyType="next"
                />
              </View>
              {touched.dobD && !errors.dob && <Text style={s.validCheck}>✓</Text>}
            </View>
            {touched.dobD && errors.dob && <Text style={s.errorText}>{errors.dob}</Text>}
          </View>

          {/* ── ID / Passport ── */}
          <Field
            label={t.cpIdLabel}
            placeholder="000000000"
            value={values.idNumber}
            onChangeText={v => set('idNumber', v.replace(/\s/g,''))}
            onBlur={() => blur('idNumber')}
            {...fieldState('idNumber')}
            ref={refs.idNumber}
            keyboardType="default"
            autoCapitalize="characters"
            returnKeyType="next"
            onSubmitEditing={() => refs.phone.current?.focus()}
            hint={t.cpIdHint}
          />

          {/* ── Phone with country code ── */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>{t.cpPhoneLabel}</Text>
            <View style={[
              s.inputWrap,
              fieldState('phone').hasError && s.inputWrapError,
              fieldState('phone').isValid  && s.inputWrapValid,
            ]}>
              <TouchableOpacity style={s.dialBtn} onPress={() => setShowPicker(true)}>
                <Text style={s.dialFlag}>{country.flag}</Text>
                <Text style={s.dialCode}>{country.dial}</Text>
                <Text style={s.dialChevron}>▾</Text>
              </TouchableOpacity>
              <View style={s.dialDivider} />
              <TextInput
                ref={refs.phone}
                style={[s.input, { flex: 1 }]}
                value={values.phone}
                onChangeText={v => set('phone', v)}
                onBlur={() => blur('phone')}
                placeholder="50 000 0000"
                placeholderTextColor="#333"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
              {fieldState('phone').isValid && <Text style={s.validCheck}>✓</Text>}
            </View>
            {fieldState('phone').hasError && <Text style={s.errorText}>{errors.phone}</Text>}
          </View>

        </Animated.View>

        {/* Privacy note */}
        <View style={s.privacyNote}>
          <Text style={s.privacyIcon}>🔒</Text>
          <Text style={s.privacyText}>{t.cpPrivacy}</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, (!allValid || loading) && s.submitBtnDisabled]}
          onPress={submit}
          disabled={loading}
          activeOpacity={0.88}
        >
          <Text style={s.submitBtnText}>
            {loading ? t.cpSaving : t.cpSubmit}
          </Text>
        </TouchableOpacity>
        {!!submitError && <Text style={s.errorText}>{submitError}</Text>}

      </ScrollView>

      {/* Country picker */}
      <CountryPicker
        visible={showPicker}
        onSelect={setCountry}
        onClose={() => setShowPicker(false)}
        title={t.cpCountryTitle}
      />
    </KeyboardAvoidingView>
  );
}

/* ─── Reusable Field ─── */
const Field = React.forwardRef(function Field(
  { label, placeholder, value, onChangeText, onBlur, hasError, isValid,
    keyboardType = 'default', returnKeyType, onSubmitEditing, autoCapitalize, hint, style },
  ref
) {
  return (
    <View style={[s.fieldWrap, style]}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputWrap, hasError && s.inputWrapError, isValid && s.inputWrapValid]}>
        <TextInput
          ref={ref}
          style={[s.input, { flex: 1 }]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor="#333"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'words'}
          returnKeyType={returnKeyType || 'next'}
          onSubmitEditing={onSubmitEditing}
          textAlign="right"
          writingDirection="rtl"
        />
        {isValid && <Text style={s.validCheck}>✓</Text>}
      </View>
      {hasError && <Text style={s.errorText}>{hasError}</Text>}
      {hint && !hasError && <Text style={s.hintText}>{hint}</Text>}
    </View>
  );
});

/* ─── Styles ─── */
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { paddingHorizontal: 22, paddingTop: 56, paddingBottom: 48 },

  back:     { marginBottom: 28 },
  backText: { color: '#555', fontSize: 15 },

  /* Header */
  headerBlock: { marginBottom: 32 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  stepDotActive: { backgroundColor: '#C0392B', borderColor: '#C0392B', width: 12, height: 12, borderRadius: 6 },
  stepLine:  { flex: 1, height: 1, backgroundColor: '#1E1E1E', marginHorizontal: 4 },
  stepLabel: { color: '#555', fontSize: 12, marginBottom: 14 },
  title:     { fontSize: 38, fontWeight: '900', color: '#FFF', lineHeight: 44, marginBottom: 10 },
  subtitle:  { color: '#555', fontSize: 14, lineHeight: 22 },

  /* Row (first+last) */
  row: { flexDirection: 'row-reverse', gap: 12 },

  /* Field */
  fieldWrap:  { marginBottom: 18 },
  label:      { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', paddingHorizontal: 16, height: 56 },
  inputWrapError: { borderColor: '#E74C3C', backgroundColor: '#130A0A' },
  inputWrapValid: { borderColor: '#27AE60' },
  input:      {
    color: '#FFF',
    fontSize: 16,
    alignSelf: 'stretch',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  validCheck: { color: '#27AE60', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  errorText:  { color: '#E74C3C', fontSize: 12, marginTop: 5 },
  hintText:   { color: '#444', fontSize: 11, marginTop: 4 },

  /* DOB */
  dobRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', paddingHorizontal: 14, height: 56, gap: 4 },
  dobSegment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dobInput: { color: '#FFF', fontSize: 18, fontWeight: '600', width: '100%', textAlign: 'center' },
  dobSep: { color: '#333', fontSize: 22, fontWeight: '300', paddingHorizontal: 2 },

  /* Phone */
  dialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  dialFlag: { fontSize: 22 },
  dialCode: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  dialChevron: { color: '#555', fontSize: 10 },
  dialDivider: { width: 1, height: 28, backgroundColor: '#1E1E1E', marginHorizontal: 10 },

  /* Privacy */
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#111', borderRadius: 14, padding: 14, gap: 10, marginBottom: 24, borderWidth: 1, borderColor: '#1E1E1E' },
  privacyIcon: { fontSize: 15 },
  privacyText: { flex: 1, color: '#555', fontSize: 12, lineHeight: 19 },

  /* Submit */
  submitBtn:         { backgroundColor: '#C0392B', borderRadius: 14, height: 58, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#2A1010', opacity: 0.5 },
  submitBtnText:     { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

/* ─── Country Picker Styles ─── */
const cp = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:       { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '65%', paddingBottom: 32 },
  handle:      { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetTitle:  { color: '#FFF', fontSize: 16, fontWeight: '700', textAlign: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E1E1E' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 14 },
  flag:        { fontSize: 26 },
  countryName: { flex: 1, color: '#FFF', fontSize: 15 },
  dialCode:    { color: '#555', fontSize: 14 },
});
