import React from 'react';
import { Platform, TextInput, View, Text } from 'react-native';
import { colors } from '../config/theme';

export default function DatePicker({ value, onChange, label, style }) {
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 8, marginRight: 12, minWidth: 150, flexShrink: 0 }}>
        {label && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>{label}</Text>}
        {React.createElement('input', {
          type: 'date',
          value: value || '',
          onChange: (e) => onChange(e.target.value),
          style: {
            padding: '9px 14px',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '14px',
            backgroundColor: '#FAFAFA',
            color: '#1F2937',
            minWidth: '140px',
            width: '100%',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            ...(style || {}),
          }
        })}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 8, marginRight: 12, minWidth: 150, flexShrink: 0 }}>
      {label && <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 4 }}>{label}</Text>}
      <TextInput
        style={{
          borderWidth: 2,
          borderColor: colors.border,
          borderRadius: 10,
          fontSize: 14,
          backgroundColor: '#FAFAFA',
          paddingHorizontal: 14,
          paddingVertical: 10,
          color: colors.text,
        }}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
      />
    </View>
  );
}
