import type { ComponentType } from 'react';

declare module '../../templates' {
  export const EnhancedTravelInfoTemplate: ComponentType<any>;
  export const TravelInfoScreenTemplate: ComponentType<any>;
  export const EntryFlowScreenTemplate: ComponentType<any> & {
    Header: ComponentType<any>;
    StatusBanner: ComponentType<any>;
    ScrollContainer: ComponentType<any>;
    AutoContent: ComponentType<any>;
    CompletionCard: ComponentType<any>;
    Categories: ComponentType<any>;
    SubmissionCountdown: ComponentType<any>;
    ActionButtons: ComponentType<any>;
    LoadingIndicator: ComponentType<any>;
    useTemplate: (...args: any[]) => any;
  };
  export const EntryGuideTemplate: ComponentType<any>;
  export const EntryPackPreviewTemplate: ComponentType<any>;
  export const EntryInfoScreenTemplate: ComponentType<any>;
  export const EntryRequirementsTemplate: ComponentType<any>;
}
