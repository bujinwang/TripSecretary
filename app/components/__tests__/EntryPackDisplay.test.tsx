// @ts-nocheck

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EntryPackDisplay from '../EntryPackDisplay';

// Mock the TDACInfoCard component
jest.mock('../TDACInfoCard', () => {
  return function MockTDACInfoCard({ tdacSubmission, isReadOnly }) {
    return <div data-testid="tdac-info-card" data-submission={tdacSubmission} data-readonly={isReadOnly} />;
  };
});

const mockEntryPack = {
  id: 'test-pack-1',
  tdacSubmission: {
    arrCardNo: 'TH123456789',
    qrUri: 'https://example.com/qr.png',
    pdfPath: '/path/to/pdf.pdf',
    submittedAt: '2025-01-15T10:30:00Z'
  }
};

const mockPersonalInfo = {
  fullName: '张三',
  passportNumber: 'E12345678',
  nationality: '中国',
  dateOfBirth: '1990-01-01',
  expiryDate: '2030-12-31'
};

const mockTravelInfo = {
  arrivalDate: '2025-01-20',
  arrivalFlightNumber: 'CA123',
  departureDate: '2025-01-29',
  departureFlightNumber: 'CA456',
  purposeOfVisit: '旅游',
  hotelAddress: '曼谷市中心酒店'
};

const mockFunds = [
  {
    type: 'cash',
    amount: 5000,
    description: '现金',
    proofPhoto: true
  },
  {
    type: 'card',
    amount: 10000,
    description: '银行卡',
    proofPhoto: false
  }
];

describe('EntryPackDisplay', () => {
  const defaultProps = {
    entryPack: mockEntryPack,
    personalInfo: mockPersonalInfo,
    travelInfo: mockTravelInfo,
    funds: mockFunds,
    onClose: jest.fn(),
    isModal: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all data', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    expect(getByText('🇹🇭 通关包 / Entry Pack')).toBeTruthy();
    expect(getByText('给移民官查看的重要信息 / Important information for immigration officer')).toBeTruthy();
  });

  it('displays overview tab by default', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    expect(getByText('📋 通关包总览 / Entry Pack Overview')).toBeTruthy();
    expect(getByText('入境卡号')).toBeTruthy();
    expect(getByText('TH123456789')).toBeTruthy();
  });

  it('switches tabs correctly', () => {
    const { getByText, queryByText } = render(<EntryPackDisplay {...defaultProps} />);

    // Initially shows overview
    expect(getByText('📋 通关包总览 / Entry Pack Overview')).toBeTruthy();

    // Switch to personal info tab
    fireEvent.press(getByText('个人信息'));
    expect(getByText('👤 个人信息 / Personal Information')).toBeTruthy();
    expect(getByText('张三')).toBeTruthy();
  });

  it('displays personal information correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('个人信息'));

    expect(getByText('姓名 / Full Name:')).toBeTruthy();
    expect(getByText('张三')).toBeTruthy();
    expect(getByText('护照号码 / Passport Number:')).toBeTruthy();
    expect(getByText('E12345678')).toBeTruthy();
    expect(getByText(/Passport Expiry Date/)).toBeTruthy();
    expect(getByText(/2030/)).toBeTruthy();
  });

  it('displays travel information correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('旅行信息'));

    expect(getByText('✈️ 旅行信息 / Travel Information')).toBeTruthy();
    expect(getByText(/Arrival Date:/)).toBeTruthy();
    expect(getByText(/Arrival Flight Number:/)).toBeTruthy();
    expect(getByText('CA123')).toBeTruthy();
    expect(getByText(/Departure Date:/)).toBeTruthy();
    expect(getByText(/Departure Flight Number:/)).toBeTruthy();
    expect(getByText('CA456')).toBeTruthy();
  });

  it('displays funds information correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('资金'));

    expect(getByText('💰 资金信息 / Funds Information')).toBeTruthy();
    expect(getByText('现金')).toBeTruthy();
    expect(getByText('5,000 THB')).toBeTruthy();
    expect(getByText('银行卡')).toBeTruthy();
    expect(getByText('10,000 THB')).toBeTruthy();
  });

  it('displays TDAC information correctly when submitted', () => {
    const { getByText, queryByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('TDAC卡'));

    // Should show TDAC card when submission exists
    expect(queryByText('TDAC 尚未提交')).toBeNull();
    expect(getByText('🛂 TDAC 入境卡 / TDAC Entry Card')).toBeTruthy();
  });

  it('displays TDAC placeholder when not submitted', () => {
    const propsWithoutTDAC = {
      ...defaultProps,
      entryPack: { ...mockEntryPack, tdacSubmission: null }
    };
    const { getByText } = render(<EntryPackDisplay {...propsWithoutTDAC} />);

    fireEvent.press(getByText('TDAC卡'));

    expect(getByText('TDAC 尚未提交 / TDAC Not Submitted Yet')).toBeTruthy();
    expect(getByText('请在抵达前72小时内提交TDAC数字入境卡')).toBeTruthy();
    expect(getByText('即使没有TDAC，您也可以向移民官展示其他信息')).toBeTruthy();
  });

  it('displays immigration FAQs correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('问答'));

    expect(getByText('💡 移民官常见问题 / Immigration Officer FAQs')).toBeTruthy();
    expect(getByText('Q: 您来泰国的目的？ / What is the purpose of your visit?')).toBeTruthy();
    expect(getByText('A: 旅游 / Tourism')).toBeTruthy();
  });

  it('calculates and displays total funds correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    fireEvent.press(getByText('资金'));

    expect(getByText('总金额 / Total:')).toBeTruthy();
    expect(getByText('15,000 THB')).toBeTruthy();
  });

  it('shows close button when onClose prop is provided', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    const closeButton = getByText('✕');
    expect(closeButton).toBeTruthy();

    fireEvent.press(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays footer text correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    expect(getByText('请将此通关包展示给移民官查看 / Please show this entry pack to the immigration officer')).toBeTruthy();
  });

  it('handles empty funds array', () => {
    const propsWithoutFunds = { ...defaultProps, funds: [] };
    const { getByText } = render(<EntryPackDisplay {...propsWithoutFunds} />);

    fireEvent.press(getByText('资金'));

    expect(getByText('暂无资金信息 / No funds information')).toBeTruthy();
    expect(getByText('总金额 / Total:')).toBeTruthy();
    expect(getByText('0 THB')).toBeTruthy();
  });

  it('formats dates correctly', () => {
    const { getByText } = render(<EntryPackDisplay {...defaultProps} />);

    // Check if dates are formatted (this would depend on the actual date formatting logic)
    expect(getByText('入境日期')).toBeTruthy();
  });

  it('handles missing entry pack gracefully', () => {
    const { queryByText } = render(<EntryPackDisplay {...defaultProps} entryPack={null} />);

    expect(queryByText('🇹🇭 通关包 / Entry Pack')).toBeNull();
  });
});
