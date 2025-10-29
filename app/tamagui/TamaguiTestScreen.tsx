// Test screen to verify Tamagui setup
import React from 'react';
import {
  YStack,
  XStack,
  Card,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Separator,
  useTheme,
} from './index';

/**
 * TamaguiTestScreen - A simple test component to verify Tamagui is working
 *
 * This component exercises various Tamagui primitives and tokens to ensure
 * the setup is complete and functional.
 */
export default function TamaguiTestScreen() {
  const theme = useTheme();

  return (
    <YStack flex={1} backgroundColor="$background" padding="$md">
      <Heading size="$5" marginBottom="$md">
        Tamagui Test Screen
      </Heading>

      <Card
        elevate
        size="$4"
        bordered
        backgroundColor="$card"
        padding="$md"
        marginBottom="$md"
      >
        <YStack space="$sm">
          <Text fontSize="$4" fontWeight="600" color="$text">
            Theme Colors
          </Text>
          <XStack space="$sm" flexWrap="wrap">
            <ColorBox color={theme.primary.val} label="Primary" />
            <ColorBox color={theme.secondary.val} label="Secondary" />
            <ColorBox color={theme.success.val} label="Success" />
            <ColorBox color={theme.warning.val} label="Warning" />
            <ColorBox color={theme.danger.val} label="Danger" />
          </XStack>
        </YStack>
      </Card>

      <Card
        elevate
        size="$4"
        bordered
        backgroundColor="$card"
        padding="$md"
        marginBottom="$md"
      >
        <YStack space="$md">
          <Text fontSize="$4" fontWeight="600" color="$text">
            Spacing Tokens
          </Text>
          <XStack space="$xs" alignItems="center">
            <Text fontSize="$2" color="$textSecondary">xs:</Text>
            <YStack height={20} width="$xs" backgroundColor="$primary" />
          </XStack>
          <XStack space="$xs" alignItems="center">
            <Text fontSize="$2" color="$textSecondary">sm:</Text>
            <YStack height={20} width="$sm" backgroundColor="$primary" />
          </XStack>
          <XStack space="$xs" alignItems="center">
            <Text fontSize="$2" color="$textSecondary">md:</Text>
            <YStack height={20} width="$md" backgroundColor="$primary" />
          </XStack>
          <XStack space="$xs" alignItems="center">
            <Text fontSize="$2" color="$textSecondary">lg:</Text>
            <YStack height={20} width="$lg" backgroundColor="$primary" />
          </XStack>
        </YStack>
      </Card>

      <Card
        elevate
        size="$4"
        bordered
        backgroundColor="$card"
        padding="$md"
        marginBottom="$md"
      >
        <YStack space="$md">
          <Text fontSize="$4" fontWeight="600" color="$text">
            Form Elements
          </Text>
          <YStack space="$sm">
            <Label htmlFor="test-input">Test Input</Label>
            <Input
              id="test-input"
              placeholder="Enter text..."
              size="$4"
            />
          </YStack>
          <Separator marginVertical="$sm" />
          <XStack space="$sm">
            <Button theme="active" size="$4">
              Primary Button
            </Button>
            <Button variant="outlined" size="$4">
              Outlined
            </Button>
          </XStack>
        </YStack>
      </Card>

      <Card
        elevate
        size="$4"
        bordered
        backgroundColor="$card"
        padding="$md"
      >
        <YStack space="$sm">
          <Text fontSize="$4" fontWeight="600" color="$text">
            Typography Sizes
          </Text>
          <Text fontSize="$1" color="$textSecondary">Size 1 - Small text</Text>
          <Text fontSize="$2" color="$textSecondary">Size 2 - Body text</Text>
          <Text fontSize="$3" color="$text">Size 3 - Default body</Text>
          <Text fontSize="$4" color="$text" fontWeight="600">Size 4 - Emphasized</Text>
        </YStack>
      </Card>
    </YStack>
  );
}

// Helper component to display color swatches
function ColorBox({ color, label }: { color: string; label: string }) {
  return (
    <YStack alignItems="center" space="$xs">
      <YStack
        width={60}
        height={60}
        backgroundColor={color}
        borderRadius="$sm"
        borderWidth={1}
        borderColor="$borderColor"
      />
      <Text fontSize="$1" color="$textSecondary">{label}</Text>
    </YStack>
  );
}
