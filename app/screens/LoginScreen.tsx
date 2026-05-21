'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  ComponentPropsWithoutRef,
  ForwardRefRenderFunction,
  HTMLAttributes,
  PropsWithChildren,
} from 'react';
import { Platform, ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocale } from '../i18n/LocaleContext';
import type { RootStackScreenProps } from '../types/navigation';
import type { Transition } from 'framer-motion';

const isWeb = Platform.OS === 'web';
const motionModule: { motion?: typeof import('framer-motion').motion } | null = isWeb
  ? // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, global-require
    require('framer-motion')
  : null;
const lucideModule:
  | {
      FileText?: React.ComponentType<ComponentPropsWithoutRef<'svg'>>;
      Package?: React.ComponentType<ComponentPropsWithoutRef<'svg'>>;
      Mic?: React.ComponentType<ComponentPropsWithoutRef<'svg'>>;
      Navigation?: React.ComponentType<ComponentPropsWithoutRef<'svg'>>;
    }
  | null = isWeb
  ? // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, global-require
    require('lucide-react')
  : null;
const motion = motionModule?.motion;
const { FileText, Package, Mic, Navigation: NavigationIcon } = lucideModule || {};

const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

// Minimal shadcn/ui-inspired primitives to keep the web screen self-contained.
const buttonVariants = {
  default:
    'bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
  ghost: 'bg-transparent hover:bg-emerald-50 text-emerald-600',
};

const buttonSizes = {
  default: 'h-11 px-5 py-2',
  sm: 'h-9 px-4 py-2 text-sm',
};

type WebButtonVariant = keyof typeof buttonVariants;
type WebButtonSize = keyof typeof buttonSizes;

interface WebButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'size'> {
  className?: string;
  variant?: WebButtonVariant;
  size?: WebButtonSize;
}

const ButtonRender: ForwardRefRenderFunction<HTMLButtonElement, WebButtonProps> = (
  { className = '', variant = 'default', size = 'default', ...props },
  ref
) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant] || buttonVariants.default,
      buttonSizes[size] || buttonSizes.default,
      className
    )}
    {...props}
  />
);

const Button = React.forwardRef<HTMLButtonElement, WebButtonProps>(ButtonRender);

Button.displayName = 'Button';

const badgeVariants = {
  default: 'bg-emerald-50 text-emerald-600',
  secondary: 'bg-emerald-100 text-emerald-700',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  className?: string;
  variant?: keyof typeof badgeVariants;
}

const Badge: React.FC<PropsWithChildren<BadgeProps>> = ({
  className = '',
  variant = 'default',
  children,
  ...props
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md border border-transparent px-3 py-1 text-xs font-semibold',
      badgeVariants[variant] || badgeVariants.default,
      className
    )}
    {...props}
  >
    {children}
  </span>
);

type CardProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const Card: React.FC<PropsWithChildren<CardProps>> = ({ className = '', children, ...props }) => (
  <div
    className={cn(
      'rounded-2xl border bg-white text-emerald-900 shadow-sm',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const CardContent: React.FC<PropsWithChildren<CardContentProps>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={cn('p-6', className)} {...props}>
    {children}
  </div>
);

type LanguageOption = {
  code: string;
  label: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
];

const softSpring: Transition = {
  type: 'spring',
  stiffness: 140,
  damping: 18,
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

interface SharedLoginScreenProps {
  languages: LanguageOption[];
  activeLanguage: string;
  setActiveLanguage: (code: string) => void;
  whisperVisible: boolean;
  onExperience: () => void;
  t: TranslationFn;
}

const WebLoginScreen: React.FC<SharedLoginScreenProps> = ({
  languages,
  activeLanguage,
  setActiveLanguage,
  whisperVisible,
  onExperience,
  t,
}) => {
  if (!motion) {
    return null;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay: 0.05 }}
      className="min-h-screen w-full bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-5 py-10"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/80 p-3 shadow-md backdrop-blur"
        >
          {languages.map(({ code, label }) => (
            <Button
              key={code}
              size="sm"
              variant="ghost"
              onClick={() => setActiveLanguage(code)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                activeLanguage === code
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-500'
                  : 'bg-white text-emerald-600 hover:bg-emerald-100'
              )}
            >
              {label}
            </Button>
          ))}
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-3xl font-black text-emerald-700 sm:text-4xl"
          >
            ✈️ {t('common.appName')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="mt-3 text-base text-emerald-600 sm:text-lg"
          >
            {t('login.tagline')}
          </motion.p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...softSpring, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {[t('login.benefits.free'), t('login.benefits.noRegistration'), t('login.benefits.instant')].map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm shadow-emerald-100"
            >
              {label}
            </Badge>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ ...softSpring, delay: 0.15 }}
        >
          <Card className="border-emerald-200 bg-white/90 shadow-lg shadow-emerald-100">
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
                {FileText ? <FileText className="h-9 w-9" /> : <span className="text-3xl">🗂️</span>}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-xl font-semibold text-emerald-800">
                  {t('login.heroCard.title')}
                </h3>
                <p className="text-sm leading-relaxed text-emerald-600 sm:text-base">
                  {t('login.heroCard.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3"
        >
          {[
            {
              icon: Package ? <Package className="h-8 w-8 text-emerald-500" /> : null,
              title: t('login.features.digitalPack'),
              emoji: '📦',
            },
            {
              icon: Mic ? <Mic className="h-8 w-8 text-emerald-500" /> : null,
              title: t('login.features.voiceAssistant'),
              emoji: '🗣️',
            },
            {
              icon: NavigationIcon ? <NavigationIcon className="h-8 w-8 text-emerald-500" /> : null,
              title: t('login.features.entryNavigation'),
              emoji: '🧭',
            },
          ].map(({ icon, title, emoji }) => (
            <motion.div
              key={title}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-6 shadow-md shadow-emerald-100"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                {icon}
                <span className="text-xl">{emoji}</span>
              </div>
              <p className="text-sm font-medium text-emerald-700 sm:text-base">
                {title}
              </p>
            </motion.div>
          ))}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            className="w-full max-w-lg"
          >
            <Button
              onClick={onExperience}
              className="h-auto w-full rounded-2xl bg-emerald-500 py-4 text-base font-semibold shadow-lg shadow-emerald-200 transition-transform hover:scale-[1.02] hover:bg-emerald-600"
            >
              🚀 {t('login.buttonText')}
            </Button>
          </motion.div>

          <p className="max-w-md text-sm text-emerald-700 sm:text-base">
            {t('login.ctaSubtitle')}
          </p>

          {whisperVisible && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-sm italic text-emerald-500/80"
            >
              {t('login.whisperText')}
            </motion.p>
          )}
        </motion.section>

        <footer className="pt-4 text-center text-xs text-emerald-500 sm:text-sm">
          🌍 {t('common.appName')} © 2025
        </footer>
      </div>
    </motion.main>
  );
};

const NativeLoginScreen: React.FC<SharedLoginScreenProps> = ({
  languages,
  activeLanguage,
  setActiveLanguage,
  whisperVisible,
  onExperience,
  t,
}) => (
  <SafeAreaView style={nativeStyles.safeArea}>
    <LinearGradient
      colors={['#E8F9F0', '#F8FFFE', '#E8F9F0']}
      style={nativeStyles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={nativeStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={nativeStyles.languageBar}>
          {languages.map(({ code, label }) => {
            const isActive = activeLanguage === code;
            return (
              <TouchableOpacity
                key={code}
                onPress={() => setActiveLanguage(code)}
                activeOpacity={0.8}
                style={[nativeStyles.languagePill, isActive && nativeStyles.languagePillActive]}
              >
                <Text style={[nativeStyles.languageLabel, isActive && nativeStyles.languageLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={nativeStyles.header}>
          <Text style={nativeStyles.title}>✈️ {t('common.appName')}</Text>
          <Text style={nativeStyles.subtitle}>{t('login.tagline')}</Text>
        </View>

        <View style={nativeStyles.badgeRow}>
          {[t('login.benefits.free'), t('login.benefits.noRegistration'), t('login.benefits.instant')].map((label) => (
            <View key={label} style={nativeStyles.badge}>
              <Text style={nativeStyles.badgeText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={nativeStyles.card}>
          <View style={nativeStyles.cardIcon}>
            <Text style={nativeStyles.cardIconEmoji}>🗂️</Text>
          </View>
          <View style={nativeStyles.cardContent}>
            <Text style={nativeStyles.cardTitle}>{t('login.heroCard.title')}</Text>
            <Text style={nativeStyles.cardDescription}>
              {t('login.heroCard.description')}
            </Text>
          </View>
        </View>

        <View style={nativeStyles.featuresGrid}>
          {[
            { title: t('login.features.digitalPack'), emoji: '📦' },
            { title: t('login.features.voiceAssistant'), emoji: '🗣️' },
            { title: t('login.features.entryNavigation'), emoji: '🧭' },
          ].map(({ title, emoji }) => (
            <View key={title} style={nativeStyles.featureCard}>
              <Text style={nativeStyles.featureEmoji}>{emoji}</Text>
              <Text style={nativeStyles.featureTitle}>{title}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onExperience}
          style={nativeStyles.ctaButton}
        >
          <Text style={nativeStyles.ctaText}>🚀 {t('login.buttonText')}</Text>
        </TouchableOpacity>

        <Text style={nativeStyles.ctaSubtext}>{t('login.ctaSubtitle')}</Text>

        {whisperVisible && (
          <Text style={nativeStyles.whisper}>{t('login.whisperText')}</Text>
        )}

        <Text style={nativeStyles.footer}>🌍 {t('common.appName')} © 2025</Text>
      </ScrollView>
    </LinearGradient>
  </SafeAreaView>
);

type LoginScreenProps = RootStackScreenProps<'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { language: activeLanguage, setLanguage: setActiveLanguage, t } = useLocale();
  const [whisperVisible, setWhisperVisible] = useState(false);

  const handleExperience = useCallback(() => {
    navigation.replace('MainTabs');
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(() => setWhisperVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isWeb) {
    return (
      <WebLoginScreen
        languages={LANGUAGES}
        activeLanguage={activeLanguage}
        setActiveLanguage={setActiveLanguage}
        whisperVisible={whisperVisible}
        onExperience={handleExperience}
        t={t}
      />
    );
  }

  return (
    <NativeLoginScreen
      languages={LANGUAGES}
      activeLanguage={activeLanguage}
      setActiveLanguage={setActiveLanguage}
      whisperVisible={whisperVisible}
      onExperience={handleExperience}
      t={t}
    />
  );
};

const nativeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F9F0',
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
  },
  languageBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'center',
    shadowColor: '#07C160',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  languagePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  languagePillActive: {
    backgroundColor: '#07C160',
    shadowColor: '#07C160',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  languageLabel: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '500',
  },
  languageLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#047857',
  },
  subtitle: {
    fontSize: 16,
    color: '#047857',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#07C160',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconEmoji: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#047857',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#07C160',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    minWidth: 110,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
  },
  ctaButton: {
    marginTop: 10,
    backgroundColor: '#07C160',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#07C160',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaSubtext: {
    marginTop: 12,
    textAlign: 'center',
    color: '#065F46',
    fontSize: 14,
  },
  whisper: {
    marginTop: 8,
    textAlign: 'center',
    color: 'rgba(4,120,87,0.7)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 24,
    textAlign: 'center',
    color: '#047857',
    fontSize: 12,
  },
});

export default LoginScreen;
