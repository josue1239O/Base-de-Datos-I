import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { getMaterias, addMateria } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';

export default function MateriasScreen({ route }) {
  const { user } = route.params;
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const canEdit = ['direccion', 'profesor', 'regente'].includes(user?.rol);

  const loadData = async () => {
    try { setMaterias(await getMaterias()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleAdd = async () => {
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa un nombre'); return; }
    try {
      await addMateria(nombre.trim());
      setNombre('');
      loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Materias ({materias.length})</Text>
        {canEdit && (
          <View style={styles.addRow}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Nombre de la materia" value={nombre} onChangeText={setNombre} />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
          </View>
        )}
        {materias.map(m => (
          <View key={m.id} style={styles.tableRow}>
            <Text style={styles.name}>{m.nombre}</Text>
          </View>
        ))}
        {materias.length === 0 && <Text style={styles.empty}>No hay materias registradas</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  addRow: { flexDirection: 'row', marginBottom: 16 },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, fontSize: 15, backgroundColor: '#FAFAFA', padding: 12, color: colors.text },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  tableRow: { borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12 },
  name: { fontSize: 15, flex: 1 },
  empty: { textAlign: 'center', color: '#666', padding: 20 },
});
