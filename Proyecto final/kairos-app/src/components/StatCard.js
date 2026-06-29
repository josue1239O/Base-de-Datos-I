import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ number, label, color = '#1a73e8' }) {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Text style={[styles.number, { color }]}>{number}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
