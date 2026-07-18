import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  UnitKind,
  MeasurementSystem,
  allowedUnits,
  displayUnitsForPreference,
  resolveIngredientUnits,
  formatQuantity,
  WEIGHT_UNITS,
  VOLUME_UNITS,
  COUNT_UNITS,
} from '../utils/units';

type UnitSelectProps = {
  kind?: UnitKind | string | null;
  value: string;
  onChange: (unit: string) => void;
  measurementSystem?: MeasurementSystem;
  preferSystemUnits?: boolean;
  enabled?: boolean;
};

export function UnitSelect({
  kind,
  value,
  onChange,
  measurementSystem = 'metric',
  preferSystemUnits = false,
  enabled = true,
}: UnitSelectProps) {
  const resolvedKind = (kind as UnitKind | undefined) || undefined;

  let options: string[];
  if (!resolvedKind) {
    options = preferSystemUnits
      ? [
          ...displayUnitsForPreference('weight', measurementSystem),
          ...displayUnitsForPreference('volume', measurementSystem),
          ...COUNT_UNITS,
        ]
      : [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];
  } else if (preferSystemUnits && resolvedKind !== 'count') {
    options = displayUnitsForPreference(resolvedKind, measurementSystem);
  } else {
    options = allowedUnits(resolvedKind);
  }

  const current = value || options[0] || '';
  const opts = options.includes(current) ? options : [current, ...options];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {opts.map(u => {
        const selected = u === current;
        return (
          <TouchableOpacity
            key={u}
            disabled={!enabled}
            onPress={() => onChange(u)}
            style={[styles.chip, selected && styles.chipSelected, !enabled && styles.chipLocked]}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{u}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function QuantityLabel({
  quantity,
  unit,
  unitKind,
  baseUnit,
  defaultDisplayUnit,
  measurementSystem = 'metric',
  style,
}: {
  quantity: number;
  unit?: string;
  unitKind?: string;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  measurementSystem?: MeasurementSystem;
  style?: object;
}) {
  const { kind, baseUnit: base, displayUnit } = resolveIngredientUnits({
    unit_kind: unitKind,
    base_unit: baseUnit || unit,
    default_display_unit: defaultDisplayUnit,
    default_unit: unit,
  });
  const formatted = formatQuantity(quantity, {
    kind,
    baseUnit: base,
    system: measurementSystem,
    preferredDisplayUnit: displayUnit,
  });
  return (
    <Text style={style}>
      {formatted.quantityLabel} {formatted.unit}
    </Text>
  );
}

export function preferredUnitForIngredient(
  ingredient: {
    unit_kind?: string | null;
    base_unit?: string | null;
    default_unit?: string | null;
    default_display_unit?: string | null;
  } | null | undefined,
  measurementSystem: MeasurementSystem = 'metric',
): { kind: UnitKind | undefined; unit: string } {
  if (!ingredient) {
    return { kind: undefined, unit: '' };
  }
  const hasHint =
    ingredient.unit_kind ||
    ingredient.base_unit ||
    ingredient.default_unit ||
    ingredient.default_display_unit;
  if (!hasHint) {
    return { kind: undefined, unit: '' };
  }

  const resolved = resolveIngredientUnits(ingredient);
  if (resolved.kind === 'count') {
    return { kind: resolved.kind, unit: resolved.displayUnit };
  }
  const systemUnits = displayUnitsForPreference(resolved.kind, measurementSystem);
  if (systemUnits.includes(resolved.displayUnit)) {
    return { kind: resolved.kind, unit: resolved.displayUnit };
  }
  return { kind: resolved.kind, unit: systemUnits[0] || resolved.baseUnit };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d4d4d4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#dcfce7',
  },
  chipLocked: {
    opacity: 0.75,
  },
  chipText: {
    color: '#374151',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
});
