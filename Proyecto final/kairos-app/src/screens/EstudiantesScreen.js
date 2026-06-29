import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { getEstudiantes, deleteEstudiante, addEstudiante, getMaterias } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';

export default function EstudiantesScreen({ route }) {
  const { user } = route.params;
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [cursoFilter, setCursoFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ codigo: '', nombre: '', email: '', telefono: '', tutor: '', curso: '1', paralelo: 'A' });

  const loadData = async () => {
    try {
      const data = await getEstudiantes();
      setEstudiantes(data);
      setFiltered(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  useEffect(() => {
    if (!cursoFilter) setFiltered(estudiantes);
    else setFiltered(estudiantes.filter(e => e.curso === cursoFilter));
  }, [cursoFilter, estudiantes]);

  const handleDelete = (id, nombre) => {
    Alert.alert('Eliminar', `¿Eliminar a ${nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteEstudiante(id);
        loadData();
      }},
    ]);
  };

  const handleAdd = async () => {
    if (!form.codigo || !form.nombre) { Alert.alert('Error', 'Código y nombre requeridos'); return; }
    try {
      await addEstudiante(form);
      setModalVisible(false);
      setForm({ codigo: '', nombre: '', email: '', telefono: '', tutor: '', curso: '1', paralelo: 'A' });
      loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, !cursoFilter && styles.filterActive]} onPress={() => setCursoFilter('')}>
          <Text style={[styles.filterText, !cursoFilter && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {['1','2','3','4','5','6'].map(c => (
          <TouchableOpacity key={c} style={[styles.filterBtn, cursoFilter === c && styles.filterActive]} onPress={() => setCursoFilter(c)}>
            <Text style={[styles.filterText, cursoFilter === c && styles.filterTextActive]}>{c}°</Text>
          </TouchableOpacity>
        ))}
      </View>

      {(user?.rol === 'direccion') && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Agregar Estudiante</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.list}>
        {filtered.map(e => (
          <View key={e.id || e.codigo} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.codigo}>{e.codigo}</Text>
              <Text style={styles.nombre}>{e.nombre}</Text>
            </View>
            <Text style={styles.detail}>Curso: {e.curso}° {e.paralelo} | Tutor: {e.tutor || 'N/A'}</Text>
            {user?.rol === 'direccion' && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(e.id, e.nombre)}>
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {filtered.length === 0 && <Text style={styles.empty}>No hay estudiantes</Text>}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Nuevo Estudiante</Text>
            <TextInput style={styles.input} placeholder="Código (ej: K0001)" value={form.codigo} onChangeText={t => setForm({...form, codigo: t})} />
            <TextInput style={styles.input} placeholder="Nombre completo" value={form.nombre} onChangeText={t => setForm({...form, nombre: t})} />
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Teléfono" value={form.telefono} onChangeText={t => setForm({...form, telefono: t})} />
            <TextInput style={styles.input} placeholder="Tutor" value={form.tutor} onChangeText={t => setForm({...form, tutor: t})} />
            <View style={styles.pickerRow}>
              {['1','2','3','4','5','6'].map(c => (
                <TouchableOpacity key={c} style={[styles.pickerBtn, form.curso === c && styles.pickerActive]} onPress={() => setForm({...form, curso: c})}>
                  <Text style={[styles.pickerText, form.curso === c && styles.pickerTextActive]}>{c}°</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.pickerRow}>
              {['A','B','C'].map(p => (
                <TouchableOpacity key={p} style={[styles.pickerBtn, form.paralelo === p && styles.pickerActive]} onPress={() => setForm({...form, paralelo: p})}>
                  <Text style={[styles.pickerText, form.paralelo === p && styles.pickerTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
                <Text style={{ color: colors.white }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  filterRow: { flexDirection: 'row', padding: 10, backgroundColor: colors.white, elevation: 2 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, marginRight: 5, backgroundColor: '#E5E7EB' },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textLight },
  filterTextActive: { color: colors.white, fontWeight: 'bold' },
  addBtn: { backgroundColor: colors.primary, margin: 10, padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  list: { flex: 1, padding: 10 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codigo: { fontSize: 13, color: colors.primary, fontWeight: 'bold' },
  nombre: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  detail: { fontSize: 13, color: colors.textLight, marginTop: 5 },
  deleteBtn: { backgroundColor: colors.danger, borderRadius: 8, padding: 6, marginTop: 8, alignSelf: 'flex-end' },
  deleteBtnText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: colors.textLight, padding: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: colors.white, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: colors.primary },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 14, backgroundColor: '#FAFAFA' },
  pickerRow: { flexDirection: 'row', marginBottom: 8 },
  pickerBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 6, backgroundColor: '#E5E7EB' },
  pickerActive: { backgroundColor: colors.primary },
  pickerText: { fontSize: 14, color: colors.textLight },
  pickerTextActive: { color: colors.white, fontWeight: 'bold' },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
});
