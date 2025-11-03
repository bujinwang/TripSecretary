/**
 * Vietnam Entry Pack Preview Configuration
 *
 * Provides copy and navigation targets for EntryPackPreviewTemplate.
 */

export const vietnamEntryPackPreviewConfig = {
  countryCode: 'vietnam',
  header: {
    title: 'Vietnam Entry Pack Preview / 越南入境包预览',
    closeIcon: '✕',
  },
  previewBanner: {
    icon: '👁️',
    title: 'Preview Mode / 预览模式',
    descriptions: [
      'Đây là bản xem trước thông tin nhập cảnh Việt Nam của bạn. Chuẩn bị đầy đủ giúp thủ tục nhập cảnh diễn ra suôn sẻ.',
      '这是越南入境资料的预览版本。提前准备完整信息，可更顺利通过海关检查。',
    ],
  },
  actions: {
    primary: {
      id: 'edit',
      label: '✏️ Tiếp tục chỉnh sửa / 继续补充信息',
      type: 'navigate',
      screen: 'VietnamTravelInfo',
      buildParams: ({ passport, destination }) => ({
        passport,
        destination,
      }),
    },
    secondary: {
      id: 'guide',
      label: '🛂 Hướng dẫn nhập cảnh / 入境手续指南',
      type: 'navigate',
      screen: 'VietnamEntryGuide',
    },
  },
  infoSection: {
    icon: '💡',
    items: [
      'Vui lòng điền phiếu nhập cảnh/ xuất cảnh giấy bằng chữ in hoa tiếng Anh và mang theo bút ký. Mỗi hành khách cần chuẩn bị 2 liên (nhập cảnh & xuất cảnh).',
      '记得随身携带蓝/黑色签字笔，越南纸质入境/出境卡需用英文大写填写，并保留出境联以便离境时交回。',
    ],
  },
};

export default vietnamEntryPackPreviewConfig;
