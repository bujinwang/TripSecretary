/**
 * Vietnam Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const vietnamEntryPackPreviewConfig = {
  countryCode: 'vietnam',
  header: {
    title: 'Xem trước thông tin nhập cảnh Việt Nam',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Chế độ xem trước',
    descriptions: [
      'Đây là bản xem trước thông tin nhập cảnh Việt Nam của bạn. Chuẩn bị đầy đủ giúp thủ tục nhập cảnh diễn ra suôn sẻ.',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Tiếp tục chỉnh sửa',
      type: 'navigate',
      screen: 'VietnamTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'guide',
      label: '🛂 Hướng dẫn nhập cảnh',
      type: 'navigate',
      screen: 'VietnamEntryGuide',
    },
  },
  infoSection: {
    icon: '💡',
    items: [
      'Vui lòng điền phiếu nhập cảnh/ xuất cảnh giấy bằng chữ in hoa tiếng Anh và mang theo bút ký. Mỗi hành khách cần chuẩn bị 2 liên (nhập cảnh & xuất cảnh).',
    ],
  },
};

export default vietnamEntryPackPreviewConfig;
