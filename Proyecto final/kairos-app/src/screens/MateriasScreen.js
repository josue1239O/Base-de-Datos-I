import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { getMaterias, addMateria, deleteMateria } from '../services/firestoreService';
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

  const handleDelete = (id, nombreMat) => {
    Alert.alert('Eliminar', `¿Eliminar "${nombreMat}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteMateria(id); loadData(); }},
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Materias ({materias.length})</Text>
        {canEdit && (
          <View style={styles.addRow}>
            <TextInput style={styles.input} placeholder="Nombre de la materia" value={nombre} onChangeText={setNombre} />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
          </View>
        )}
        {materias.map(m => (
          <View key={m.id} style={styles.row}>
            <Text style={styles.name}>{m.nombre}</Text>
            {canEdit && (
              <TouchableOpacity onPress={() => handleDelete(m.id, m.nombre)}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {materias.length === 0 && <Text style={styles.empty}>No hay materias registradas</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { backgroundColor: colors.white, margin: 10, borderRadius: 12, padding: 16, elevation: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 15 },
  addRow: { flexDirection: 'row', marginBottom: 15 },
  input: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA', padding: 10, fontSize: 14, marginRight: 8 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 10, width: 44, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: colors.white, fontSize: 22, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  name: { fontSize: 15, flex: 1 },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textLight, padding: 20 },
});
