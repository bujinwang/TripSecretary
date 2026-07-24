

/**
 * Thailand Entry Pack Preview Configuration
 *
 * Uses EntryPackPreviewTemplate overrides/slots to deliver the richer TDAC preview
 * experience without keeping a Thailand-specific screen implementation.
 */

import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  EntryPackPreviewTemplateHeader as HeaderBase,
} from '../../../templates/EntryPackPreviewTemplate';
import { InfoAlert, ActionButtonGroup } from '../../../components/preview';
import EntryPackDisplay from '../../../components/EntryPackDisplay';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { initializeAnimations } from '../../../utils/animations/previewAnimations';
import { PreviewHaptics } from '../../../utils/haptics';
import { useTranslation } from '../../../i18n/LocaleContext';

const getTemplateContext = (props: Record<string, unknown> = {}): Record<string, unknown> => (props.templateContext as Record<string, unknown>) || props || {};

const formatDate = (dateString: string | null | undefined, locale: string = 'en'): string | null => {
  if (!dateString) {
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat(locale || 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return formatter.format(new Date(dateString));
  } catch (error) {
    console.warn('Failed to format date for Thailand preview:', error);
    return null;
  }
};

const ThailandHeader = (props: Record<string, unknown>) => {
  const ctx = getTemplateContext(props);
  const config = ctx.config as Record<string, unknown> | undefined;
  const headerConfig = (config as Record<string, unknown>)?.header as Record<string, unknown> | undefined;
  return <HeaderBase title={headerConfig?.title as string | Record<string, unknown> | undefined} subtitle={headerConfig?.subtitle as string | Record<string, unknown> | undefined} onClose={undefined} />;
};

const ThailandDeadlineAlert = (props: Record<string, unknown> = {}) => {
  const ctx = getTemplateContext(props);
  const entryPack = ctx.entryPack as Record<string, unknown> | undefined;
  const { t, language } = useTranslation();

  const epTravel = (entryPack as Record<string, unknown> | undefined)?.travel as Record<string, unknown> | undefined;
  const arrivalDate = epTravel?.arrivalDate as string | undefined;
  if (!arrivalDate) {
    return null;
  }

  const arrival = new Date(arrivalDate);
  const now = new Date();
  const deadline = new Date(arrival.getTime() - 72 * 60 * 60 * 1000); // 72h before arrival
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (Number.isNaN(daysRemaining) || daysRemaining > 3) {
    return null;
  }

  if (daysRemaining < 0) {
    return (
      <InfoAlert
        variant="error"
        title={t('thailand.preview.deadline.passedTitle')}
        message={t('thailand.preview.deadline.passedMessage')}
      />
    );
  }

  return (
    <InfoAlert
      variant="warning"
      title={t('thailand.preview.deadline.warningTitle')}
      message={t('thailand.preview.deadline.warningMessage', {
        days: daysRemaining,
        date: formatDate(deadline.toISOString(), language) || undefined,
      })}
      dismissible={false}
    />
  );
};


const ThailandFooterActions = (props: Record<string, unknown> = {}) => {
  const ctx = getTemplateContext(props);
  const nav = ctx.navigation as Record<string, unknown> & { navigate?: (screen: string, params?: Record<string, unknown>) => void };
  const passport = ctx.passport as Record<string, unknown>;
  const destination = ctx.destination as Record<string, unknown>;
  const ep = ctx.entryPack as Record<string, unknown> | undefined;
  const { t } = useTranslation();
  const tdacSubmission = ep?.tdacSubmission as Record<string, unknown> | undefined;
  const isSubmitted = Boolean(tdacSubmission?.arrCardNo);

  const handleContinue = () => {
    PreviewHaptics.buttonPress?.();
    nav.navigate?.('ThailandEntryFlow', {
      passport,
      destination,
    });
  };

  const handleSecondary = () => {
    PreviewHaptics.buttonPress?.();
    if (isSubmitted && tdacSubmission?.qrUri) {
      nav.navigate?.('TDACWebView', {
        qrUri: tdacSubmission.qrUri as string,
      });
      return;
    }
    nav.navigate?.('TDACSelection', {
      passport,
      destination,
    });
  };

  const secondaryLabel = isSubmitted
    ? t('thailand.preview.actions.openTdac')
    : t('thailand.preview.actions.submitTdac');

  return (
    <View style={styles.footerContainer}>
      <ActionButtonGroup
        variant="preview-info"
        primaryLabel={t('thailand.preview.actions.edit')}
        onPrimaryPress={handleContinue}
        secondaryLabel={secondaryLabel}
        onSecondaryPress={handleSecondary}
      />
    </View>
  );
};

const ThailandEntryPackDetails = (props: Record<string, unknown> = {}) => {
  const ctx = getTemplateContext(props);
  const ep = ctx.entryPack as Record<string, unknown>;

  return (
    <EntryPackDisplay
      entryPack={{ ...ep, country: 'th' }}
      personalInfo={ep.personalInfo as Record<string, unknown>}
      travelInfo={ep.travel as Record<string, unknown>}
      funds={(ep.funds as unknown[]) || []}
      country="th"
    />
  );
};

export const thailandEntryPackPreviewConfig = {
  countryCode: 'thailand',
  destinationId: 'th',
  header: {
    title: {
      values: {
        th: 'ชุดข้อมูลตรวจคนเข้าเมือง - ตัวอย่าง / Entry Pack Preview',
        'zh-CN': '通关包预览',
        'zh-TW': '通關包預覽',
        en: 'Entry Pack Preview',
      },
    },
    subtitle: {
      values: {
        th: 'เช็คความพร้อมก่อนยื่น TDAC',
        'zh-CN': '提交前检查准备情况',
        'zh-TW': '提交前檢查準備情況',
        en: 'Check readiness before TDAC submission',
      },
    },
    closeIcon: '✕',
  },
  infoSection: {
    icon: 'ℹ️',
    text: [
      {
        values: {
          th: 'Tip: ยื่น TDAC อย่างน้อย 24 ชม. ก่อนเดินทางเพื่อรับ QR ล่วงหน้า',
          'zh-CN': '提示：尽量在出发前24小时提交TDAC以提前获取二维码',
          'zh-TW': '提示：出發前24小時提交TDAC以提前獲取二維碼',
          en: 'Tip: Submit TDAC at least 24h before travel to get QR early',
        },
      },
      {
        values: {
          th: 'เจ้าหน้าที่อาจขอดูหลักฐานการเงินและที่พัก ควรเตรียมเอกสารสำรอง',
          'zh-CN': '移民官可能查看资金与住宿证明，建议准备备用文件',
          'zh-TW': '移民官可能查看資金與住宿證明，建議準備備用文件',
          en: 'Immigration may request fund and stay proofs; prepare backup documents',
        },
      },
    ],
  },
  components: {
    Header: ThailandHeader,
    EntryPack: ThailandEntryPackDetails,
    Actions: () => null, // Use custom footer instead of default actions
  },
  slots: {
    beforeContent: (context: Record<string, unknown>) => (
      <React.Fragment>
        <ThailandDeadlineAlert {...(context || {})} />
      </React.Fragment>
    ),
    footer: (context: Record<string, unknown>) => (
      <React.Fragment>
        <ThailandFooterActions {...(context || {})} />
      </React.Fragment>
    ),
  },
  hooks: {
    onScreenMount: () => {
      try {
        initializeAnimations();
      } catch (error) {
        console.warn('Failed to initialize preview animations:', error);
      }
    },
    onActionPress: () => {
      PreviewHaptics.buttonPress?.();
    },
  },
};

export default thailandEntryPackPreviewConfig;

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
});
