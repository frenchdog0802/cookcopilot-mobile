import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
import { colors } from '../theme/tokens';

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

  const options = useMemo(() => {
    if (!resolvedKind) {
      // Unknown ingredient: allow any common unit (parity with web UnitSelect)
      return preferSystemUnits
        ? [
            ...displayUnitsForPreference('weight', measurementSystem),
            ...displayUnitsForPreference('volume', measurementSystem),
            ...COUNT_UNITS,
          ]
        : [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];
    }
    if (preferSystemUnits && resolvedKind !== 'count') {
      return displayUnitsForPreference(resolvedKind, measurementSystem);
    }
    return allowedUnits(resolvedKind);
  }, [resolvedKind, preferSystemUnits, measurementSystem]);

  // Never keep a mismatched unit (e.g. pcs) selectable when kind is known
  const current = options.includes(value) ? value : options[0] || '';

  useEffect(() => {
    if (enabled && value && options.length > 0 && !options.includes(value) && current) {
      onChange(current);
    }
  }, [enabled, value, current, options, onChange]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map(u => {
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
    return { kind: 'count', unit: 'pcs' };
  }
  const hasHint =
    ingredient.unit_kind ||
    ingredient.base_unit ||
    ingredient.default_unit ||
    ingredient.default_display_unit;
  if (!hasHint) {
    return { kind: 'count', unit: 'pcs' };
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
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.herb,
    backgroundColor: colors.sage,
  },
  chipLocked: {
    opacity: 0.75,
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.herbDeep,
    fontWeight: '600',
  },
});
