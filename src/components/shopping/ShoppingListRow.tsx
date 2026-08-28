import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { PlusIcon, MinusIcon, CheckIcon, TrashIcon } from 'lucide-react-native';
import { QuantityLabel } from '../UnitSelect';
import type { MeasurementSystem } from '../../utils/units';
import { colors } from '../../theme/tokens';
import { usePressScale } from '../../hooks/usePressScale';

export type ShoppingListRowItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  unit_kind?: string;
  base_unit?: string;
  default_display_unit?: string;
};

type ShoppingListRowProps = {
  item: ShoppingListRowItem;
  measurementSystem: MeasurementSystem;
  onToggle: (id: string) => void;
  onUpdateQuantity: (item: ShoppingListRowItem, delta: number) => void;
  onRemove: (id: string) => void;
};

function ShoppingListRowComponent({
  item,
  measurementSystem,
  onToggle,
  onUpdateQuantity,
  onRemove,
}: ShoppingListRowProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={animatedStyle}>
      <View
        className={`flex-row items-center p-3 bg-surface rounded-xl mb-2 border border-line ${
          item.checked ? 'opacity-70' : ''
        }`}
      >
        <Pressable
          onPress={() => onToggle(item.id)}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          className="mr-3"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
        >
          <View
            className={`w-6 h-6 rounded border-2 items-center justify-center ${
              item.checked ? 'bg-herb border-herb' : 'border-line'
            }`}
          >
            {item.checked ? <CheckIcon size={14} color={colors.onHerb} /> : null}
          </View>
        </Pressable>

        <View className="flex-1 mr-3">
          <Text
            className={`font-medium capitalize ${item.checked ? 'line-through text-muted' : 'text-ink'}`}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <QuantityLabel
            quantity={item.quantity}
            unit={item.unit}
            unitKind={item.unit_kind}
            baseUnit={item.base_unit}
            defaultDisplayUnit={item.default_display_unit}
            measurementSystem={measurementSystem}
            style={{ fontSize: 12, color: item.checked ? colors.line : colors.muted }}
          />
        </View>

        <View className="flex-row items-center mr-2">
          <Pressable
            onPress={() => onUpdateQuantity(item, -0.5)}
            className="bg-linen p-2 rounded-lg border border-line"
          >
            <MinusIcon size={16} color={colors.ink} />
          </Pressable>

          <Text className="text-lg font-bold w-12 text-center">{item.quantity}</Text>

          <Pressable onPress={() => onUpdateQuantity(item, 0.5)} className="bg-herb p-2 rounded-lg">
            <PlusIcon size={16} color={colors.onHerb} />
          </Pressable>
        </View>

        <Pressable className="p-2" onPress={() => onRemove(item.id)}>
          <TrashIcon size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const ShoppingListRow = memo(ShoppingListRowComponent);
