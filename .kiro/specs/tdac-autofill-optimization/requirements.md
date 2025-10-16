# Requirements Document

## Introduction

本需求文档描述了TDAC（泰国入境卡）WebView自动填充功能的优化方案。当前系统已经实现了基础的自动填充功能，但在处理复杂的下拉框（特别是省份选择）和动态加载的表单元素时存在挑战。本优化旨在提升自动填充的成功率和用户体验，同时避免重复构建复杂的表单组件。

## Glossary

- **TDAC**: Thailand Digital Arrival Card，泰国数字入境卡系统
- **WebView**: React Native中用于显示网页内容的组件
- **Auto-fill**: 自动填充，通过JavaScript注入自动填写表单字段
- **Dropdown/Select**: 下拉选择框，用于从预定义列表中选择值
- **Autocomplete**: 自动完成输入框，支持搜索和选择
- **Angular Material**: TDAC网站使用的UI框架
- **FormControl**: Angular表单控件的标识属性

## Requirements

### Requirement 1: 增强下拉框自动填充能力

**User Story:** 作为用户，我希望系统能够自动填充所有类型的下拉框（包括省份、国家、职业等），这样我就不需要手动在复杂的列表中查找和选择。

#### Acceptance Criteria

1. WHEN 用户触发自动填充, THE System SHALL 检测页面中所有Angular Material下拉框组件（mat-select）
2. WHEN 系统检测到mat-select组件, THE System SHALL 通过模拟用户交互打开下拉框
3. WHEN 下拉框打开后, THE System SHALL 在选项列表中查找匹配用户数据的选项
4. WHEN 找到匹配选项, THE System SHALL 模拟点击该选项以完成选择
5. WHERE 下拉框支持搜索功能, THE System SHALL 优先使用搜索输入来过滤选项

### Requirement 19: 从护照数据自动填充国籍和身份信息

**User Story:** 作为用户，我希望系统能够根据已识别的护照信息自动填充国籍、公民身份等字段，这样我就不需要重复输入已知信息。

#### Acceptance Criteria

1. WHEN 自动填充开始, THE System SHALL 从PassportDataService加载用户的护照数据
2. WHEN 检测到"Nationality"字段, THE System SHALL 使用护照中的nationality字段自动填充
3. WHEN 检测到"Citizenship"或"Country of Citizenship"字段, THE System SHALL 使用护照的签发国家自动填充
4. WHEN 检测到"Passport Issuing Country"字段, THE System SHALL 使用护照的issuingCountry字段自动填充
5. THE System SHALL 将护照中的以下字段映射到TDAC表单：
   - passportNo → Passport Number
   - nationality → Nationality
   - issuingCountry → Passport Issuing Country
   - birthDate → Date of Birth
   - gender → Gender
   - nameEn → Family Name + First Name（自动拆分）

### Requirement 2: 优化Autocomplete字段填充

**User Story:** 作为用户，我希望系统能够正确填充带有自动完成功能的输入框（如国家、城市），这样系统就能触发正确的选项列表并自动选择。

#### Acceptance Criteria

1. WHEN 系统填充autocomplete输入框, THE System SHALL 触发input事件以激活下拉选项列表
2. WHEN 选项列表出现, THE System SHALL 等待DOM更新完成（最多2秒）
3. WHEN 选项列表加载完成, THE System SHALL 查找并点击匹配的选项
4. IF 精确匹配未找到, THEN THE System SHALL 尝试模糊匹配（包含、开头匹配）
5. WHEN 选择完成, THE System SHALL 验证输入框的值已正确更新

### Requirement 3: 实现智能重试机制

**User Story:** 作为用户，我希望自动填充功能能够处理动态加载的表单元素，这样即使页面分步加载，系统也能成功填充所有字段。

#### Acceptance Criteria

1. WHEN 自动填充开始, THE System SHALL 记录所有待填充字段的状态
2. WHILE 存在未成功填充的字段, THE System SHALL 每500毫秒重试一次
3. WHEN 重试次数达到15次（7.5秒）, THE System SHALL 停止重试并报告失败字段
4. WHEN 字段成功填充, THE System SHALL 从重试列表中移除该字段
5. WHEN 所有字段填充完成或达到最大重试次数, THE System SHALL 显示填充结果摘要

### Requirement 4: 增强表单导航自动化

**User Story:** 作为用户，我希望系统能够自动完成多步表单的导航，这样我只需要点击一次"自动填充"就能完成整个流程。

#### Acceptance Criteria

1. WHEN 当前页面填充完成, THE System SHALL 自动查找并点击"Continue"或"Next"按钮
2. WHEN 进入下一页, THE System SHALL 等待页面加载完成（检测新表单元素出现）
3. WHEN 新页面加载完成, THE System SHALL 自动开始填充该页面的字段
4. WHEN 检测到最后一页（Submit按钮）, THE System SHALL 停止自动导航并提示用户确认
5. WHERE 某一步填充失败, THE System SHALL 暂停自动导航并通知用户

### Requirement 5: 提供可视化填充进度反馈

**User Story:** 作为用户，我希望能够实时看到自动填充的进度和状态，这样我就能了解系统正在做什么以及是否需要我的干预。

#### Acceptance Criteria

1. WHEN 自动填充开始, THE System SHALL 显示浮动进度指示器
2. WHEN 每个字段填充成功, THE System SHALL 更新进度计数（如"已填充 5/12 字段"）
3. WHEN 字段填充失败, THE System SHALL 在进度指示器中标记失败字段名称
4. WHEN 自动填充完成, THE System SHALL 显示完整的结果摘要（成功/失败/跳过）
5. WHERE 用户点击进度指示器, THE System SHALL 展开详细的字段填充状态列表

### Requirement 6: 支持手动干预和混合模式

**User Story:** 作为用户，当自动填充无法处理某些字段时，我希望能够轻松地手动填充这些字段，同时保留已自动填充的内容。

#### Acceptance Criteria

1. WHEN 自动填充完成, THE System SHALL 保持"复制助手"面板可访问
2. WHEN 用户打开复制助手, THE System SHALL 高亮显示未成功填充的字段
3. WHEN 用户点击单个字段的"自动填充"按钮, THE System SHALL 仅重试该特定字段
4. WHEN 用户点击"复制"按钮, THE System SHALL 将值复制到剪贴板供手动粘贴
5. WHERE 所有字段都已成功填充, THE System SHALL 在复制助手中显示成功标记

### Requirement 7: 优化省份和地区选择

**User Story:** 作为用户，我希望系统能够正确处理泰国省份、地区、子地区的三级联动选择，这样我就不需要手动在复杂的层级结构中导航。

#### Acceptance Criteria

1. WHEN 填充省份字段, THE System SHALL 首先选择省份（Province）
2. WHEN 省份选择完成, THE System SHALL 等待地区（District）下拉框变为可用
3. WHEN 地区下拉框可用, THE System SHALL 选择对应的地区
4. WHEN 地区选择完成, THE System SHALL 等待子地区（Sub-district）下拉框变为可用
5. WHEN 子地区下拉框可用, THE System SHALL 选择对应的子地区并填充邮编

### Requirement 8: 实现填充策略配置

**User Story:** 作为开发者，我希望能够配置不同字段的填充策略和优先级，这样系统就能根据字段的复杂度采用最合适的填充方法。

#### Acceptance Criteria

1. THE System SHALL 维护一个字段配置映射，包含每个字段的填充策略
2. WHERE 字段类型为"text", THE System SHALL 使用直接值设置策略
3. WHERE 字段类型为"select", THE System SHALL 使用下拉框选择策略
4. WHERE 字段类型为"autocomplete", THE System SHALL 使用搜索和选择策略
5. WHERE 字段类型为"radio", THE System SHALL 使用单选按钮点击策略

### Requirement 9: 提取并存储提交结果

**User Story:** 作为用户，我希望系统能够自动提取提交成功后的PDF和QR码，并保存到App数据库中，这样我就能在离线状态下查看和使用入境卡信息。

#### Acceptance Criteria

1. WHEN TDAC提交成功, THE System SHALL 检测页面中的PDF下载链接或QR码图片
2. WHEN 检测到PDF, THE System SHALL 下载PDF文件到App本地存储
3. WHEN 检测到QR码图片, THE System SHALL 提取QR码的base64数据或图片URL
4. WHEN 提取完成, THE System SHALL 将以下数据保存到App数据库：
   - 入境卡号（Arrival Card Number）
   - PDF文件路径
   - QR码图片数据
   - 提交时间戳
   - 旅客姓名和护照号
   - 到达日期和航班信息
5. WHEN 数据保存成功, THE System SHALL 在"我的旅程"或历史记录中显示该入境卡记录

### Requirement 10: 支持离线查看入境卡

**User Story:** 作为用户，我希望能够在没有网络的情况下查看已保存的入境卡信息和QR码，这样我在飞机上或入境时就能随时出示。

#### Acceptance Criteria

1. WHEN 用户打开"我的旅程"或历史记录, THE System SHALL 显示所有已保存的入境卡列表
2. WHEN 用户点击某个入境卡记录, THE System SHALL 从本地数据库加载并显示完整信息
3. THE System SHALL 显示以下信息：
   - QR码（可放大查看）
   - 入境卡号
   - 旅客信息（姓名、护照号、国籍）
   - 旅行信息（到达日期、航班号、目的地）
   - 住宿信息（酒店地址、联系方式）
4. WHERE PDF文件存在, THE System SHALL 提供"查看PDF"按钮打开完整文档
5. WHERE 用户需要分享, THE System SHALL 提供"分享QR码"功能（保存到相册或发送）

### Requirement 11: 实现入境卡数据同步

**User Story:** 作为用户，我希望系统能够将入境卡信息与我的护照和旅行信息关联，这样我就能在一个地方管理所有旅行文档。

#### Acceptance Criteria

1. WHEN 入境卡保存成功, THE System SHALL 将其关联到对应的护照记录（通过passportId外键）
2. WHEN 用户查看护照详情, THE System SHALL 显示该护照相关的所有入境卡记录
3. WHEN 用户创建新的旅行计划, THE System SHALL 检查是否已有对应目的地的有效入境卡
4. WHERE 入境卡即将过期（如30天内到达日期）, THE System SHALL 在旅行计划中显示提醒
5. THE System SHALL 支持为同一护照保存多个入境卡（不同旅行）

### Requirement 12: 集成到PassportDataService

**User Story:** 作为开发者，我希望入境卡数据能够通过统一的PassportDataService访问，这样就能保持数据访问的一致性和利用现有的缓存机制。

#### Acceptance Criteria

1. THE System SHALL 在SecureStorageService中创建arrival_cards表存储入境卡数据
2. THE System SHALL 在PassportDataService中添加以下方法：
   - getArrivalCards(userId) - 获取用户所有入境卡
   - getArrivalCardsByPassport(passportId) - 获取特定护照的入境卡
   - saveArrivalCard(arrivalCardData) - 保存新入境卡
   - updateArrivalCard(cardId, updates) - 更新入境卡信息
   - deleteArrivalCard(cardId) - 删除入境卡
3. THE System SHALL 利用PassportDataService的缓存机制缓存入境卡数据
4. WHEN 入境卡数据更新, THE System SHALL 自动使相关缓存失效
5. THE System SHALL 在getAllUserData()方法中包含入境卡数据

### Requirement 13: 从WebView提取用户填写的数据

**User Story:** 作为用户，我希望系统能够记住我在TDAC网页中填写的信息（如住宿地址、联系方式等），这样下次填写时就能自动使用这些经过验证的数据。

#### Acceptance Criteria

1. WHEN 用户在WebView中填写表单字段, THE System SHALL 通过JavaScript监听输入事件
2. WHEN 用户点击"Continue"或"Next"按钮, THE System SHALL 提取当前页面所有已填写字段的值
3. THE System SHALL 提取以下类型的数据：
   - 文本输入框的值（input[type="text"]）
   - 下拉框的选中值（select, mat-select）
   - 单选按钮的选中值（radio buttons）
   - Autocomplete的最终选中值
4. WHEN 数据提取完成, THE System SHALL 将数据保存到本地数据库的travel_info表
5. WHERE 字段已存在于数据库, THE System SHALL 更新为最新值（用户可能修改了）

### Requirement 14: 利用TDAC表单验证

**User Story:** 作为用户，我希望系统能够利用TDAC网页的表单验证功能，这样我就能确保填写的数据（如省份、邮编、电话号码）符合泰国的格式要求。

#### Acceptance Criteria

1. WHEN 用户在WebView中填写字段, THE System SHALL 允许TDAC的原生验证运行
2. WHEN TDAC显示验证错误, THE System SHALL 检测错误消息并暂停自动填充
3. WHERE 验证失败, THE System SHALL 在App中显示提示："请在网页中修正标红的字段"
4. WHEN 用户修正错误后, THE System SHALL 提取修正后的正确值并保存
5. THE System SHALL 在下次自动填充时使用这些经过验证的值

### Requirement 15: 中文辅助和自动翻译

**User Story:** 作为不懂英文的用户，我希望系统能够在需要填写英文的字段旁边显示中文提示和翻译建议，这样我就能理解每个字段的含义并正确填写。

#### Acceptance Criteria

1. WHEN WebView加载TDAC表单, THE System SHALL 通过JavaScript注入检测所有表单字段
2. WHEN 检测到表单字段, THE System SHALL 在字段旁边注入中文标签浮层
3. THE System SHALL 为以下字段类型提供中文提示：
   - 字段名称翻译（如"Family Name" → "姓"）
   - 字段说明翻译（如"Enter your last name as shown in passport"）
   - 示例值（如"Zhang"）
4. WHERE 字段需要英文输入, THE System SHALL 提供"自动翻译"按钮
5. WHEN 用户点击"自动翻译"按钮, THE System SHALL 将用户输入的中文转换为拼音或英文

### Requirement 16: 智能拼音和翻译转换

**User Story:** 作为用户，我希望能够输入中文，系统自动转换为英文拼音或翻译填入表单，这样我就不需要自己拼写英文。

#### Acceptance Criteria

1. THE System SHALL 在复制助手中为需要英文的字段提供"中文输入"选项
2. WHEN 用户在中文输入框中输入中文, THE System SHALL 实时显示转换预览
3. WHEN 用户确认, THE System SHALL 将转换结果自动填入WebView的对应字段
4. THE System SHALL 使用以下转换策略：
   - 姓名字段：使用本地拼音库（pinyin-pro）转换为大写拼音
   - 地址字段：使用预定义的城市/省份英文名映射表
   - 职业字段：使用预定义的职业中英文对照表
   - 其他文本：使用本地拼音库转换
5. WHERE 转换结果不确定（如多音字）, THE System SHALL 提供多个选项供用户选择

### Requirement 18: 本地翻译数据库

**User Story:** 作为开发者，我希望系统使用本地翻译数据库而不是在线API，这样就能保证离线可用、响应快速且无需额外费用。

#### Acceptance Criteria

1. THE System SHALL 维护以下本地翻译映射表：
   - 表单字段名称中英文对照（约50个字段）
   - 常见职业中英文对照（约100个职业）
   - 中国城市/省份英文名（约400个地名）
   - 常见旅行目的中英文对照（约20个）
2. THE System SHALL 使用 `pinyin-pro` npm包进行中文到拼音的转换
3. THE System SHALL 在App启动时预加载所有翻译映射表到内存
4. WHERE 映射表中没有对应翻译, THE System SHALL 回退到拼音转换
5. THE System SHALL 支持通过App更新机制更新翻译映射表

### Requirement 17: 表单字段中文覆盖层

**User Story:** 作为不懂英文的用户，我希望在WebView中看到中文的字段说明覆盖层，这样我就能理解每个字段的含义而不需要切换到其他界面。

#### Acceptance Criteria

1. WHEN WebView显示TDAC表单, THE System SHALL 在表单上方注入一个可切换的中文覆盖层
2. WHEN 用户点击"显示中文提示"按钮, THE System SHALL 在每个字段旁边显示中文气泡
3. THE System SHALL 在气泡中显示：
   - 字段中文名称（大字体）
   - 填写说明（小字体）
   - 示例值（如果适用）
4. WHEN 用户点击气泡, THE System SHALL 高亮对应的表单字段
5. WHERE 字段已自动填充, THE System SHALL 在气泡中显示"✓ 已填充"标记


