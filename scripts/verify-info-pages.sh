#!/bin/bash

# 验证台湾、新加坡、马来西亚入境信息页和要求确认页的脚本

echo "======================================"
echo "验证入境信息页和要求确认页"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success=0
failed=0

# 函数：检查文件是否存在
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} 文件存在: $1"
        ((success++))
    else
        echo -e "${RED}✗${NC} 文件缺失: $1"
        ((failed++))
    fi
}

# 函数：检查文件内容
check_content() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✓${NC} $3"
        ((success++))
    else
        echo -e "${RED}✗${NC} $3"
        ((failed++))
    fi
}

echo "1. 检查屏幕文件..."
echo "----------------------------"
check_file "app/screens/taiwan/TaiwanInfoScreen.tsx"
check_file "app/screens/taiwan/TaiwanRequirementsScreen.tsx"
check_file "app/screens/singapore/SingaporeInfoScreen.tsx"
check_file "app/screens/singapore/SingaporeRequirementsScreen.tsx"
check_file "app/screens/malaysia/MalaysiaInfoScreen.tsx"
check_file "app/screens/malaysia/MalaysiaRequirementsScreen.tsx"
echo ""

echo "2. 检查导出配置..."
echo "----------------------------"
check_content "app/screens/taiwan/index.tsx" "TaiwanInfoScreen" "台湾 InfoScreen 已导出"
check_content "app/screens/taiwan/index.tsx" "TaiwanRequirementsScreen" "台湾 RequirementsScreen 已导出"
check_content "app/screens/singapore/index.tsx" "SingaporeInfoScreen" "新加坡 InfoScreen 已导出"
check_content "app/screens/singapore/index.tsx" "SingaporeRequirementsScreen" "新加坡 RequirementsScreen 已导出"
check_content "app/screens/malaysia/index.tsx" "MalaysiaInfoScreen" "马来西亚 InfoScreen 已导出"
check_content "app/screens/malaysia/index.tsx" "MalaysiaRequirementsScreen" "马来西亚 RequirementsScreen 已导出"
echo ""

echo "3. 检查主导出文件..."
echo "----------------------------"
check_content "app/screens/index.tsx" "export \* from './taiwan'" "台湾屏幕已在主导出中"
check_content "app/screens/index.tsx" "export \* from './singapore'" "新加坡屏幕已在主导出中"
check_content "app/screens/index.tsx" "export \* from './malaysia'" "马来西亚屏幕已在主导出中"
echo ""

echo "4. 检查导航注册..."
echo "----------------------------"
check_content "app/navigation/AppNavigator.js" "TaiwanInfoScreen" "台湾 InfoScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "TaiwanRequirementsScreen" "台湾 RequirementsScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "name=\"TaiwanInfo\"" "台湾 InfoScreen 路由已注册"
check_content "app/navigation/AppNavigator.js" "name=\"TaiwanRequirements\"" "台湾 RequirementsScreen 路由已注册"

check_content "app/navigation/AppNavigator.js" "SingaporeInfoScreen" "新加坡 InfoScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "SingaporeRequirementsScreen" "新加坡 RequirementsScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "name=\"SingaporeInfo\"" "新加坡 InfoScreen 路由已注册"
check_content "app/navigation/AppNavigator.js" "name=\"SingaporeRequirements\"" "新加坡 RequirementsScreen 路由已注册"

check_content "app/navigation/AppNavigator.js" "MalaysiaInfoScreen" "马来西亚 InfoScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "MalaysiaRequirementsScreen" "马来西亚 RequirementsScreen 已在导航中导入"
check_content "app/navigation/AppNavigator.js" "name=\"MalaysiaInfo\"" "马来西亚 InfoScreen 路由已注册"
check_content "app/navigation/AppNavigator.js" "name=\"MalaysiaRequirements\"" "马来西亚 RequirementsScreen 路由已注册"
echo ""

echo "5. 检查目的地配置..."
echo "----------------------------"
check_content "app/screens/SelectDestinationScreen.tsx" "id: 'tw'.*enabled: true" "台湾已在目的地列表中启用"
check_content "app/screens/SelectDestinationScreen.tsx" "id: 'sg'.*enabled: true" "新加坡已在目的地列表中启用"
check_content "app/screens/SelectDestinationScreen.tsx" "id: 'my'.*enabled: true" "马来西亚已在目的地列表中启用"
echo ""

echo "6. 检查导航逻辑..."
echo "----------------------------"
check_content "app/screens/SelectDestinationScreen.tsx" "navigate('TaiwanInfo'" "台湾导航到 InfoScreen"
check_content "app/screens/SelectDestinationScreen.tsx" "navigate('SingaporeInfo'" "新加坡导航到 InfoScreen"
check_content "app/screens/SelectDestinationScreen.tsx" "navigate('MalaysiaInfo'" "马来西亚导航到 InfoScreen"
echo ""

echo "7. 检查 i18n 翻译..."
echo "----------------------------"
check_content "app/i18n/locales.js" "taiwan: {" "台湾 i18n 配置存在"
check_content "app/i18n/locales.js" "singapore: {" "新加坡 i18n 配置存在"
check_content "app/i18n/locales.js" "malaysia: {" "马来西亚 i18n 配置存在"

# 检查中文翻译内容（根据最新调研结果）
if grep -q "台湾入境签证与电子入境卡" "app/i18n/locales.js"; then
    echo -e "${GREEN}✓${NC} 台湾中文翻译已更新（包含签证要求）"
    ((success++))
else
    echo -e "${RED}✗${NC} 台湾中文翻译可能未更新"
    ((failed++))
fi

if grep -q "2024年2月9日起中国护照免签30天" "app/i18n/locales.js"; then
    echo -e "${GREEN}✓${NC} 新加坡中文翻译已更新（免签政策）"
    ((success++))
else
    echo -e "${RED}✗${NC} 新加坡中文翻译可能未更新"
    ((failed++))
fi

if grep -q "2023年12月1日起中国护照免签30天" "app/i18n/locales.js"; then
    echo -e "${GREEN}✓${NC} 马来西亚中文翻译已更新（免签政策）"
    ((success++))
else
    echo -e "${RED}✗${NC} 马来西亚中文翻译可能未更新"
    ((failed++))
fi
echo ""

echo "======================================"
echo "验证结果"
echo "======================================"
echo -e "${GREEN}成功: $success${NC}"
echo -e "${RED}失败: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查都通过了！台湾、新加坡、马来西亚的入境信息页和要求确认页已正确配置。${NC}"
    exit 0
else
    echo -e "${RED}✗ 有 $failed 项检查未通过，请检查上述失败项。${NC}"
    exit 1
fi
