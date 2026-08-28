import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PlusIcon, MinusIcon, TrashIcon } from 'lucide-react-native';
import { QuantityLabel } from '../UnitSelect';
import type { MeasurementSystem } from '../../utils/units';
import type { PantryItem } from '../../types';
import { colors } from '../../theme/tokens';

type PantryItemRowProps = {
  item: PantryItem;
  measurementSystem: MeasurementSystem;
  onUpdateQuantity: (item: PantryItem, delta: number) => void;
  onRemove: (id: string) => void;
};

function PantryItemRowComponent({
  item,
  measurementSystem,
  onUpdateQuantity,
  onRemove,
}: PantryItemRowProps) {
  return (
    <View className="flex-row items-center p-3 bg-surface rounded-xl mb-2 border border-line">
      <View className="flex-1 mr-3">
        <Text className="font-semibold text-ink capitalize" numberOfLines={1}>
          {item.name}
        </Text>
      </View>

      <View className="flex-row items-center mr-2">
        <TouchableOpacity
          onPress={() => onUpdateQuantity(item, -0.5)}
          className="bg-linen p-2 rounded-lg border border-line"
        >
          <MinusIcon size={16} color={colors.ink} />
        </TouchableOpacity>

        <QuantityLabel
          quantity={item.quantity}
          unit={item.unit}
          unitKind={item.unit_kind}
          baseUnit={item.base_unit}
          defaultDisplayUnit={item.default_display_unit}
          measurementSystem={measurementSystem}
          style={{ width: 72, textAlign: 'center', fontWeight: '700', fontSize: 14 }}
        />

        <TouchableOpacity
          onPress={() => onUpdateQuantity(item, 0.5)}
          className="bg-herb p-2 rounded-lg"
        >
          <PlusIcon size={16} color={colors.onHerb} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => onRemove(item.id)} className="p-2">
        <TrashIcon size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

export const PantryItemRow = memo(PantryItemRowComponent);
