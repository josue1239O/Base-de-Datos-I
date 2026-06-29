import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { db } from '../config/firebase';
import { getEstudiantes, getAsistenciaByFecha, getMaterias, addAsistencia, getEstudianteByCodigo } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';

export default function RegistrosScreen({ route }) {
  const { user } = route.params;
  const hoy = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(hoy);
  const [cursoFilter, setCursoFilter] = useState('');
  const [materiaFilter, setMateriaFilter] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filteredRegs, setFilteredRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [materiaId, setMateriaId] = useState('');

  const loadData = async () => {
    try {
      const [ests, regs, mats] = await Promise.all([getEstudiantes(), getAsistenciaByFecha(fecha), getMaterias()]);
      setEstudiantes(ests);
      setRegistros(regs);
      setMaterias(mats);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [fecha]));

  useEffect(() => {
    let result = [...registros];
    if (cursoFilter) {
      const estIds = estudiantes.filter(e => e.curso === cursoFilter).map(e => e.id);
      result = result.filter(r => estIds.includes(r.estudianteId));
    }
    if (materiaFilter) result = result.filter(r => r.materiaId === materiaFilter);
    setFilteredRegs(result);
  }, [cursoFilter, materiaFilter, registros, estudiantes]);

  const handleRegister = async () => {
    if (!codigo) { Alert.alert('Error', 'Ingresa el código del estudiante'); return; }
    if (materias.length > 0 && !materiaId) { Alert.alert('Error', 'Selecciona una materia'); return; }
    try {
      const result = await getEstudianteByCodigo(codigo);
      if (!result) { Alert.alert('Error', 'Estudiante no encontrado'); return; }
      const ahora = new Date();
      const horaStr = ahora.toTimeString().split(' ')[0].substring(0, 5);
      const [hL, mL] = ('07:30').split(':').map(Number);
      const limite = new Date(); limite.setHours(hL, mL + 15, 0);
      const estado = ahora <= limite ? 'a tiempo' : 'tarde';
      await addAsistencia({ estudianteId: result.estudiante.id, materiaId, fecha: hoy, hora: horaStr, estado });
      Alert.alert('Éxito', `Asistencia registrada: ${estado}`);
      setCodigo('');
      loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registrar Asistencia</Text>
        <TextInput style={styles.input} placeholder="Código del estudiante (K0001)" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" />
        <View style={styles.matRow}>
          {materias.map(m => (
            <TouchableOpacity key={m.id} style={[styles.matBtn, materiaId === m.id && styles.matActive]} onPress={() => setMateriaId(m.id)}>
              <Text style={[styles.matText, materiaId === m.id && styles.matTextActive]}>{m.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.regBtn} onPress={handleRegister}>
          <Text style={styles.regBtnText}>Registrar Asistencia</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros del {fecha}</Text>
        <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={fecha} onChangeText={setFecha} />
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterBtn, !cursoFilter && styles.filterActive]} onPress={() => setCursoFilter('')}><Text style={[styles.filterText, !cursoFilter && styles.filterTextActive]}>Todos</Text></TouchableOpacity>
          {['1','2','3','4','5','6'].map(c => (
            <TouchableOpacity key={c} style={[styles.filterBtn, cursoFilter === c && styles.filterActive]} onPress={() => setCursoFilter(c)}>
              <Text style={[styles.filterText, cursoFilter === c && styles.filterTextActive]}>{c}°</Text>
            </TouchableOpacity>
          ))}
        </View>
        {filteredRegs.map((r, i) => {
          const est = estudiantes.find(e => e.id === r.estudianteId);
          const mat = materias.find(m => m.id === r.materiaId);
          return (
            <View key={i} style={styles.recordRow}>
              <View style={[styles.dot, { backgroundColor: r.estado === 'a tiempo' ? colors.success : colors.danger }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recordName}>{est?.nombre || 'Desconocido'} ({est?.codigo || ''})</Text>
                <Text style={styles.recordDetail}>{r.hora} - {mat?.nombre || 'Sin materia'}</Text>
              </View>
              <Text style={[styles.recordStatus, { color: r.estado === 'a tiempo' ? colors.success : colors.danger }]}>{r.estado === 'a tiempo' ? 'A tiempo' : 'Tarde'}</Text>
            </View>
          );
        })}
        {filteredRegs.length === 0 && <Text style={styles.empty}>Sin registros</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { backgroundColor: colors.white, margin: 10, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: colors.primary, marginBottom: 10 },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA', padding: 12, fontSize: 14, marginBottom: 8 },
  matRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  matBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 5, marginBottom: 5, backgroundColor: '#E5E7EB' },
  matActive: { backgroundColor: colors.primary },
  matText: { fontSize: 12, color: colors.textLight },
  matTextActive: { color: colors.white, fontWeight: 'bold' },
  regBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  regBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  filterRow: { flexDirection: 'row', marginBottom: 10 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, marginRight: 5, backgroundColor: '#E5E7EB' },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textLight },
  filterTextActive: { color: colors.white, fontWeight: 'bold' },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  recordName: { fontSize: 14, fontWeight: 500 },
  recordDetail: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  recordStatus: { fontSize: 12, fontWeight: 500 },
  empty: { textAlign: 'center', color: colors.textLight, padding: 20 },
});
