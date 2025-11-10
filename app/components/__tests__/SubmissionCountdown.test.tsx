// @ts-nocheck

import React from 'react';
import { render } from '@testing-library/react-native';
import SubmissionCountdown from '../SubmissionCountdown';
import CountdownFormatter from '../../utils/CountdownFormatter';
import ArrivalWindowCalculator from '../../utils/thailand/ArrivalWindowCalculator';

// Mock the ArrivalWindowCalculator
jest.mock('../../utils/thailand/ArrivalWindowCalculator', () => ({
  getSubmissionWindow: jest.fn(),
  getUIState: jest.fn(),
}));

// Mock the CountdownFormatter
jest.mock('../../utils/CountdownFormatter', () => ({
  formatTimeRemaining: jest.fn(),
}));

const mockArrivalWindowCalculator = require('../../utils/thailand/ArrivalWindowCalculator');

describe('SubmissionCountdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update every second by default', () => {
    const mockArrivalDate = new Date('2025-10-18T10:00:00Z');
    const mockWindow = {
      state: 'within-window',
      timeRemaining: 2 * 60 * 60 * 1000, // 2 hours
      message: 'Can submit now',
      icon: '⏰',
      urgencyColor: 'green',
      showCountdown: true,
    };

    const mockFormattedTime = {
      display: '1小时 59分钟 30秒',
      components: { days: 0, hours: 1, minutes: 59, seconds: 30 },
      isUrgent: false,
      isEmpty: false,
    };

    const mockCountdownFormatter = require('../../utils/CountdownFormatter');

    mockArrivalWindowCalculator.getSubmissionWindow.mockReturnValue(mockWindow);
    mockCountdownFormatter.formatTimeRemaining.mockReturnValue(mockFormattedTime);
    mockArrivalWindowCalculator.getUIState.mockReturnValue({
      variant: 'primary',
      subtitle: 'Ready to submit',
    });

    const { getByText } = render(
      <SubmissionCountdown arrivalDate={mockArrivalDate} locale="zh" />
    );

    // Check that the countdown is displayed with seconds
    expect(getByText('剩余时间')).toBeTruthy();
    expect(getByText('1小时 59分钟 30秒')).toBeTruthy();

    // Verify that CountdownFormatter.formatTimeRemaining was called with showSeconds: true
    expect(mockCountdownFormatter.formatTimeRemaining).toHaveBeenCalledWith(
      2 * 60 * 60 * 1000,
      'zh',
      { showSeconds: true }
    );
  });

  it('should handle no arrival date', () => {
    const { getByText } = render(
      <SubmissionCountdown arrivalDate={null} locale="zh" />
    );

    expect(getByText('未设置抵达日期')).toBeTruthy();
    expect(getByText('请在旅行信息中设置您的抵达日期')).toBeTruthy();
  });

  it('should use custom update interval when provided', () => {
    const mockArrivalDate = new Date('2025-10-18T10:00:00Z');
    const customInterval = 5000; // 5 seconds

    const mockWindow = {
      state: 'within-window',
      timeRemaining: 60 * 60 * 1000, // 1 hour
      message: 'Can submit now',
      icon: '⏰',
      urgencyColor: 'green',
      showCountdown: true,
    };

    mockArrivalWindowCalculator.getSubmissionWindow.mockReturnValue(mockWindow);
    mockArrivalWindowCalculator.formatTimeRemaining.mockReturnValue({
      display: '59分钟 30秒',
      components: { days: 0, hours: 0, minutes: 59, seconds: 30 },
      isUrgent: false,
      isEmpty: false,
    });
    mockArrivalWindowCalculator.getUIState.mockReturnValue({
      variant: 'primary',
      subtitle: 'Ready to submit',
    });

    const { getByText } = render(
      <SubmissionCountdown
        arrivalDate={mockArrivalDate}
        locale="zh"
        updateInterval={customInterval}
      />
    );

    expect(getByText('剩余时间')).toBeTruthy();
    expect(getByText('59分钟 30秒')).toBeTruthy();
  });
});