/**
 * ProgressOverviewCard - Display completion progress with visual indicators
 *
 * Shows overall progress for multi-step forms or data collection processes.
 * Used in travel info screens across all countries.
 *
 * @example
 * ```tsx
 * <ProgressOverviewCard
 *   completedFields={7}
 *   totalFields={10}
 *   sections={[
 *     { name: 'Passport', completed: true },
 *     { name: 'Travel', completed: false },
 *   ]}
 * />
 * ```
 */

import React from 'react';
import { YStack, XStack, Text, styled, Progress } from 'tamagui';
import { BaseCard } from './BaseCard';

export interface ProgressSection {
  /**
   * Section name
   */
  name: string;

  /**
   * Section icon
   */
  icon?: string;

  /**
   * Whether the section is completed
   */
  completed: boolean;

  /**
   * Number of fields in this section
   */
  fieldCount?: number;

  /**
   * Number of completed fields in this section
   */
  completedFields?: number;
}

export interface ProgressOverviewCardProps {
  /**
   * Total number of completed fields
   */
  completedFields: number;

  /**
   * Total number of fields
   */
  totalFields: number;

  /**
   * Breakdown by sections
   */
  sections?: ProgressSection[];

  /**
   * Show percentage
   */
  showPercentage?: boolean;

  /**
   * Custom title
   */
  title?: string;

  /**
   * Custom message when all fields are completed
   */
  completionMessage?: string;

  /**
   * Custom message when fields are incomplete
   */
  incompleteMessage?: string;
}

const Container = styled(YStack, {
  gap: '$md',
});

const Header = styled(YStack, {
  gap: '$xs',
});

const Title = styled(Text, {
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '600',
  color: '$text',
});

const ProgressText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: 'bold',
  color: '$primary',
});

const PercentageText = styled(Text, {
  fontFamily: '$body',
  fontSize: '$2',
  color: '$textSecondary',
  marginLeft: '$xs',
});

const Message = styled(Text, {
  fontFamily: '$body',
  fontSize: '$2',
  color: '$textSecondary',
  lineHeight: 20,
});

const SectionList = styled(YStack, {
  gap: '$sm',
  marginTop: '$sm',
});

const SectionRow = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: '$xs',
});

const SectionInfo = styled(XStack, {
  alignItems: 'center',
  gap: '$sm',
  flex: 1,
});

const SectionIcon = styled(Text, {
  fontSize: 20,
});

const SectionName = styled(Text, {
  fontFamily: '$body',
  fontSize: '$2',
  color: '$text',
  flex: 1,
});

const SectionStatus = styled(Text, {
  fontSize: 16,
});

const StyledProgress = styled(Progress, {
  height: 8,
  backgroundColor: '$backgroundLight',
  borderRadius: '$full',

  variants: {
    status: {
      incomplete: {},
      complete: {},
    },
  } as const,
});

/**
 * ProgressOverviewCard Component
 */
export const ProgressOverviewCard: React.FC<ProgressOverviewCardProps> = ({
  completedFields,
  totalFields,
  sections,
  showPercentage = true,
  title = 'Completion Progress',
  completionMessage = 'All information completed! Ready to proceed.',
  incompleteMessage = 'Complete all fields to continue.',
}) => {
  const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  const isComplete = completedFields === totalFields && totalFields > 0;

  return (
    <BaseCard variant="elevated" padding="lg">
      <Container>
        {/* Header */}
        <Header>
          <Title>{title}</Title>
          <XStack alignItems="baseline">
            <ProgressText>
              {completedFields}/{totalFields}
            </ProgressText>
            {showPercentage && <PercentageText>({percentage}%)</PercentageText>}
          </XStack>
        </Header>

        {/* Progress Bar */}
        <StyledProgress
          value={percentage}
          max={100}
          status={isComplete ? 'complete' : 'incomplete'}
        >
          <Progress.Indicator
            animation="bouncy"
            backgroundColor={isComplete ? '$success' : '$primary'}
          />
        </StyledProgress>

        {/* Message */}
        <Message>{isComplete ? completionMessage : incompleteMessage}</Message>

        {/* Section Breakdown */}
        {sections && sections.length > 0 && (
          <SectionList>
            {sections.map((section, index) => (
              <SectionRow key={index}>
                <SectionInfo>
                  {section.icon && <SectionIcon>{section.icon}</SectionIcon>}
                  <SectionName>{section.name}</SectionName>
                  {section.fieldCount !== undefined && section.completedFields !== undefined && (
                    <Text fontSize="$1" color="$textSecondary">
                      {section.completedFields}/{section.fieldCount}
                    </Text>
                  )}
                </SectionInfo>
                <SectionStatus>{section.completed ? '✅' : '⭕'}</SectionStatus>
              </SectionRow>
            ))}
          </SectionList>
        )}
      </Container>
    </BaseCard>
  );
};

export default ProgressOverviewCard;
