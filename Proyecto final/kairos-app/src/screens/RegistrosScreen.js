import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getEstudiantes, getAsistenciaByFecha, getMaterias, addAsistencia, getEstudianteByCodigo } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';
import { formatDate, today } from '../utils/dates';

export default function RegistrosScreen({ route }) {
  const { user } = route.params;
  const [fecha, setFecha] = useState(today());
  const [cursoFilter, setCursoFilter] = useState('');
  const [materiaFilter, setMateriaFilter] = useState('');
  const [estudiantes, setEstudiantes] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filteredRegs, setFilteredRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [resultMsg, setResultMsg] = useState(null);
  const [config, setConfig] = useState({ horaLimite: '07:30', toleranciaMinutos: 15 });

  const loadData = useCallback(async () => {
    try {
      const confSnap = await getDoc(doc(db, 'config', 'general'));
      if (confSnap.exists()) setConfig(confSnap.data());
      const [ests, regs, mats] = await Promise.all([getEstudiantes(), getAsistenciaByFecha(fecha), getMaterias()]);
      setEstudiantes(ests);
      setRegistros(regs);
      setMaterias(mats);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [fecha]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
    setResultMsg(null);
    if (!codigo) { setResultMsg({ type: 'error', text: 'Ingresa un código' }); return; }
    try {
      const result = await getEstudianteByCodigo(codigo);
      if (!result) { setResultMsg({ type: 'error', text: 'Estudiante no encontrado' }); return; }
      const ahora = new Date();
      const horaStr = ahora.toTimeString().split(' ')[0].substring(0, 5);
      const [hL, mL] = (config.horaLimite || '07:30').split(':').map(Number);
      const limite = new Date(); limite.setHours(hL, mL + (config.toleranciaMinutos || 15), 0);
      const estado = ahora <= limite ? 'a tiempo' : 'tarde';
      const tipo = materiaId ? 'materia' : 'general';
      await addAsistencia({ estudianteId: result.estudiante.id, materiaId: materiaId || '', fecha: today(), hora: horaStr, estado, tipo });
      setResultMsg({ type: 'success', text: `Registrado: ${result.estudiante.nombre} (${estado})` });
      setCodigo('');
      loadData();
    } catch (e) { setResultMsg({ type: 'error', text: 'Error: ' + e.message }); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Registrar Asistencia</Text>
        <View style={styles.registerForm}>
          <Text style={styles.label}>Código del Estudiante</Text>
          <TextInput style={styles.codeInput} placeholder="K0001" value={codigo} onChangeText={setCodigo} autoCapitalize="characters" />
          <Text style={[styles.label, { marginTop: 12 }]}>Materia (opcional)</Text>
          <Picker selectedValue={materiaId} onValueChange={setMateriaId} style={styles.picker}>
            <Picker.Item label="Asistencia general (sin materia)" value="" />
            {materias.map(m => <Picker.Item key={m.id} label={m.nombre} value={m.id} />)}
          </Picker>
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>
          {resultMsg && (
            <Text style={{ marginTop: 12, fontSize: resultMsg.type === 'success' ? 18 : 14, color: resultMsg.type === 'success' ? colors.success : colors.danger, textAlign: 'center', fontWeight: resultMsg.type === 'success' ? '600' : '400' }}>
              {resultMsg.text}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Registros del {formatDate(fecha)}</Text>
        <View style={styles.filtersRow}>
          <DatePicker label="Fecha" value={fecha} onChange={setFecha} />
          <View style={styles.filterWrap}>
            <Text style={styles.label}>Curso</Text>
            <Picker selectedValue={cursoFilter} onValueChange={setCursoFilter} style={styles.picker}>
              <Picker.Item label="Todos" value="" />
              {['1','2','3','4','5','6'].map(c => <Picker.Item key={c} label={c + '°'} value={c} />)}
            </Picker>
          </View>
          <View style={styles.filterWrap}>
            <Text style={styles.label}>Materia</Text>
            <Picker selectedValue={materiaFilter} onValueChange={setMateriaFilter} style={styles.picker}>
              <Picker.Item label="Todas" value="" />
              <Picker.Item label="General (sin materia)" value="__general" />
              {materias.map(m => <Picker.Item key={m.id} label={m.nombre} value={m.id} />)}
            </Picker>
          </View>
        </View>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Nombre</Text>
          <Text style={[styles.th, { flex: 1 }]}>Hora</Text>
          <Text style={[styles.th, { flex: 1 }]}>Materia</Text>
          <Text style={[styles.th, { flex: 1 }]}>Estado</Text>
        </View>
        {filteredRegs.map((r, i) => {
          const est = estudiantes.find(e => e.id === r.estudianteId);
          const mat = r.materiaId ? materias.find(m => m.id === r.materiaId) : null;
          const aTiempo = r.estado === 'a tiempo';
          return (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, { flex: 2 }]}>{est?.nombre || 'Desconocido'}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{r.hora}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{mat?.nombre || 'General'}</Text>
              <View style={{ flex: 1 }}><Text style={[styles.statusBadge, { backgroundColor: aTiempo ? '#D1FAE5' : '#FEE2E2', color: aTiempo ? '#065F46' : '#991B1B' }]}>{aTiempo ? 'A Tiempo' : 'Tarde'}</Text></View>
            </View>
          );
        })}
        {filteredRegs.length === 0 && <Text style={styles.empty}>No hay registros</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  label: { marginBottom: 4, fontWeight: '600', fontSize: 13, color: colors.text },
  registerForm: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  codeInput: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, fontSize: 24, backgroundColor: '#FAFAFA', padding: 16, color: colors.text, textAlign: 'center', letterSpacing: 3 },
  picker: { height: 44, borderWidth: 2, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA', marginBottom: 4 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 16 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  filterWrap: { marginBottom: 8, marginRight: 12, minWidth: 150, flexShrink: 0 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12 },
  th: { fontWeight: '600', fontSize: 13, color: colors.textLight },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12 },
  td: { fontSize: 13, color: colors.text },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '500', overflow: 'hidden' },
  empty: { textAlign: 'center', color: '#666', padding: 20 },
});
