import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

interface AssetIconProps {
  source: ImageSourcePropType;
  fallbackName: React.ComponentProps<typeof Ionicons>['name'];
  fallbackColor: string;
  size: number;
  style?: StyleProp<ImageStyle>;
}

export default function AssetIcon({ source, fallbackName, fallbackColor, size, style }: AssetIconProps) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [source]);

  if (loadFailed) {
    return (
      <Ionicons
        name={fallbackName}
        size={Math.round(size * 0.72)}
        color={fallbackColor}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <Image
      source={source}
      resizeMode="contain"
      onError={() => setLoadFailed(true)}
      style={[{ width: size, height: size }, style]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
