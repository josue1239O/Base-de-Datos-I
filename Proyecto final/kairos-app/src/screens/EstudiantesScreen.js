import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getEstudiantes, addEstudiante } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';

export default function EstudiantesScreen({ route }) {
  const { user } = route.params;
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [cursoFilter, setCursoFilter] = useState('');
  const [paraleloFilter, setParaleloFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', tutor: '', curso: '1', paralelo: 'A' });

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
    let result = estudiantes;
    if (cursoFilter) result = result.filter(e => e.curso === cursoFilter);
    if (paraleloFilter) result = result.filter(e => e.paralelo === paraleloFilter);
    setFiltered(result);
  }, [cursoFilter, paraleloFilter, estudiantes]);

  const genCodigo = () => 'K' + String(Date.now()).slice(-6);

  const handleAdd = async () => {
    if (!form.nombre) { Alert.alert('Error', 'Nombre es requerido'); return; }
    const codigo = genCodigo();
    try {
      await addEstudiante({ ...form, codigo });
      if (form.email) {
        fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: 'service_ks7xe43',
            template_id: 'template_w74dsjz',
            user_id: 'wzekdRmtLOZHXjr6Y',
            template_params: {
              to_email: form.email,
              to_name: form.nombre,
              codigo,
              qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + codigo,
            }
          })
        }).catch(() => {});
      }
      setModalVisible(false);
      setForm({ nombre: '', email: '', telefono: '', tutor: '', curso: '1', paralelo: 'A' });
      loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <View style={styles.filterItem}>
          <Picker selectedValue={cursoFilter} onValueChange={setCursoFilter} style={styles.picker}>
            <Picker.Item label="Todos los cursos" value="" />
            {['1','2','3','4','5','6'].map(c => <Picker.Item key={c} label={c + '°'} value={c} />)}
          </Picker>
        </View>
        <View style={styles.filterItem}>
          <Picker selectedValue={paraleloFilter} onValueChange={setParaleloFilter} style={styles.picker}>
            <Picker.Item label="Todos los paralelos" value="" />
            {['A','B','C'].map(p => <Picker.Item key={p} label={p} value={p} />)}
          </Picker>
        </View>
      </View>

      {(user?.rol === 'direccion') && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Agregar Estudiante</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.list}>
        <View style={styles.tableHeaderLabelRow}>
          <Text style={styles.tableHeaderText}>Código</Text>
          <Text style={styles.tableHeaderText}>Nombre</Text>
          <Text style={styles.tableHeaderText}>Curso</Text>
          <Text style={styles.tableHeaderText}>Tutor</Text>
        </View>
        {filtered.map(e => (
          <View key={e.id || e.codigo} style={styles.tableRow}>
            <Text style={styles.cellText}>{e.codigo}</Text>
            <Text style={[styles.cellText, styles.cellNombre]}>{e.nombre}</Text>
            <Text style={styles.cellText}>{e.curso}° {e.paralelo}</Text>
            <Text style={styles.cellText}>{e.tutor || 'N/A'}</Text>
          </View>
        ))}
        {filtered.length === 0 && <Text style={styles.empty}>No hay estudiantes</Text>}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Estudiante</Text>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput style={styles.input} placeholder="Nombre completo" value={form.nombre} onChangeText={t => setForm({...form, nombre: t})} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="correo@ejemplo.com" value={form.email} onChangeText={t => setForm({...form, email: t})} keyboardType="email-address" />
            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} placeholder="Número de teléfono" value={form.telefono} onChangeText={t => setForm({...form, telefono: t})} />
            <Text style={styles.label}>Tutor</Text>
            <TextInput style={styles.input} placeholder="Nombre del tutor" value={form.tutor} onChangeText={t => setForm({...form, tutor: t})} />
            <Text style={styles.label}>Curso</Text>
            <Picker selectedValue={form.curso} onValueChange={c => setForm({...form, curso: c})} style={styles.modalPicker}>
              {['1','2','3','4','5','6'].map(c => <Picker.Item key={c} label={c + '°'} value={c} />)}
            </Picker>
            <Text style={styles.label}>Paralelo</Text>
            <Picker selectedValue={form.paralelo} onValueChange={p => setForm({...form, paralelo: p})} style={styles.modalPicker}>
              {['A','B','C'].map(p => <Picker.Item key={p} label={p} value={p} />)}
            </Picker>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleAdd}>
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  filterBar: { flexDirection: 'row', padding: 10, backgroundColor: colors.white, elevation: 2 },
  filterItem: { flex: 1, marginRight: 8 },
  picker: { height: 44, backgroundColor: '#FAFAFA' },
  label: { marginBottom: 4, fontWeight: '600', fontSize: 13, color: colors.text, marginTop: 8 },
  modalPicker: { height: 44, backgroundColor: '#FAFAFA', marginBottom: 8 },
  tableHeaderLabelRow: { backgroundColor: '#F9FAFB', flexDirection: 'row', padding: 12 },
  tableHeaderText: { fontWeight: '600', fontSize: 13, color: '#6B7280', flex: 1 },
  addBtn: { backgroundColor: '#3B82F6', borderRadius: 8, padding: 12, margin: 10, alignItems: 'center' },
  addBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  list: { flex: 1, padding: 10 },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'center' },
  cellText: { fontSize: 13, color: '#1F2937', flex: 1 },
  cellNombre: { fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#6B7280', padding: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.white, borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: colors.primary },
  input: { borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 10, fontSize: 15, backgroundColor: '#FAFAFA', padding: 12, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
});
