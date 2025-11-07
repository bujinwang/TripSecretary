/**
 * Thailand Entry Pack Preview Configuration
 *
 * Uses EntryPackPreviewTemplate overrides/slots to deliver the richer TDAC preview
 * experience without keeping a Thailand-specific screen implementation.
 */

import React from 'react';
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

const getTemplateContext = (props = {}) => props.templateContext || props || {};

const formatDate = (dateString) => {
  if (!dateString) {
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat('th-TH', {
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

const ThailandHeader = (props = {}) => {
  const { isOfficialPack, config } = getTemplateContext(props);
  const title = isOfficialPack
    ? 'ชุดข้อมูลตรวจคนเข้าเมือง / Entry Pack'
    : config?.header?.title;
  const subtitle = isOfficialPack
    ? 'TDAC พร้อมใช้งานที่สนามบิน'
    : config?.header?.subtitle;

  return <HeaderBase title={title} subtitle={subtitle} />;
};

const ThailandDeadlineAlert = (props = {}) => {
  const { entryPack } = getTemplateContext(props);
  const { t } = useTranslation();

  const arrivalDate = entryPack?.travel?.arrivalDate;
  if (!arrivalDate) {
    return null;
  }

  const arrival = new Date(arrivalDate);
  const now = new Date();
  const deadline = new Date(arrival.getTime() - 72 * 60 * 60 * 1000); // 72h before arrival
  const daysRemaining = Math.ceil((deadline - now) / (24 * 60 * 60 * 1000));

  if (Number.isNaN(daysRemaining) || daysRemaining > 3) {
    return null;
  }

  if (daysRemaining < 0) {
    return (
      <InfoAlert
        variant="error"
        title={t('thailand.preview.deadline.passedTitle', {
          defaultValue: 'เลยกำหนดยื่น TDAC ออนไลน์แล้ว',
        })}
        message={t('thailand.preview.deadline.passedMessage', {
          defaultValue:
            'เตรียมกรอกบัตร ตม. กระดาษที่สนามบิน และเผื่อเวลาเข้าคิวพิเศษ',
        })}
      />
    );
  }

  return (
    <InfoAlert
      variant="warning"
      title={t('thailand.preview.deadline.warningTitle', {
        defaultValue: 'ใกล้ครบกำหนดยื่น TDAC',
      })}
      message={t('thailand.preview.deadline.warningMessage', {
        defaultValue: 'ควรยื่น TDAC ภายใน {{days}} วัน (ก่อน {{date}})',
        days: daysRemaining,
        date: formatDate(deadline),
      })}
      dismissible={false}
    />
  );
};


const ThailandFooterActions = (props = {}) => {
  const { navigation, passport, destination, entryPack } = getTemplateContext(props);
  const { t } = useTranslation();
  const isSubmitted = Boolean(entryPack?.tdacSubmission?.arrCardNo);

  const handleContinue = () => {
    PreviewHaptics.buttonPress?.();
    navigation.navigate('ThailandEntryFlow', {
      passport,
      destination,
    });
  };

  const handleSecondary = () => {
    PreviewHaptics.buttonPress?.();
    if (isSubmitted && entryPack?.tdacSubmission?.qrUri) {
      navigation.navigate('TDACWebView', {
        qrUri: entryPack.tdacSubmission.qrUri,
      });
      return;
    }
    navigation.navigate('TDACSelection', {
      passport,
      destination,
    });
  };

  const secondaryLabel = isSubmitted
    ? t('thailand.preview.actions.openTdac', {
        defaultValue: 'เปิด QR Code TDAC',
      })
    : t('thailand.preview.actions.submitTdac', {
        defaultValue: 'ยื่น TDAC ออนไลน์',
      });

  return (
    <View style={styles.footerContainer}>
      <ActionButtonGroup
        variant="preview-info"
        primaryLabel={t('thailand.preview.actions.edit', {
          defaultValue: 'กลับไปแก้ไขข้อมูล',
        })}
        onPrimaryPress={handleContinue}
        secondaryLabel={secondaryLabel}
        onSecondaryPress={handleSecondary}
      />
    </View>
  );
};

const ThailandEntryPackDetails = (props = {}) => {
  const { entryPack } = getTemplateContext(props);

  return (
    <EntryPackDisplay
      entryPack={{ ...entryPack, country: 'th' }}
      personalInfo={entryPack.personalInfo}
      travelInfo={entryPack.travel}
      funds={entryPack.funds || []}
      country="th"
    />
  );
};

export const thailandEntryPackPreviewConfig = {
  countryCode: 'thailand',
  destinationId: 'th',
  header: {
    title: 'ชุดข้อมูลตรวจคนเข้าเมือง - ตัวอย่าง / Entry Pack Preview',
    subtitle: 'เช็คความพร้อมก่อนยื่น TDAC',
    closeIcon: '✕',
  },
  infoSection: {
    icon: 'ℹ️',
    items: [
      'Tip: ยื่น TDAC ก่อนเดินทางอย่างน้อย 24 ชม. เพื่อรับ QR Code ล่วงหน้า.',
      'เจ้าหน้าที่อาจขอดูหลักฐานการเงินและที่พัก ควรเตรียมเอกสารสำรองไว้เสมอ.',
    ],
  },
  components: {
    Header: ThailandHeader,
    EntryPack: ThailandEntryPackDetails,
    Actions: () => null, // Use custom footer instead of default actions
  },
  slots: {
    beforeContent: (context) => (
      <React.Fragment>
        <ThailandDeadlineAlert {...(context || {})} />
      </React.Fragment>
    ),
    footer: (context) => (
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
