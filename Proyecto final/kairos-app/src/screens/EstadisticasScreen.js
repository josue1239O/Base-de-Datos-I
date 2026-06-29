import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors } from '../config/theme';

export default function EstadisticasScreen({ route }) {
  const { user } = route.params;
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(hoy);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);

  const loadStats = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    try {
      const estSnap = await getDocs(collection(db, 'estudiantes'));
      const ests = estSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEstudiantes(ests);

      const asisSnap = await getDocs(query(collection(db, 'asistencia'), where('fecha', '>=', fechaInicio), where('fecha', '<=', fechaFin)));
      const asistencias = asisSnap.docs.map(d => d.data());

      const total = asistencias.length;
      const aTiempo = asistencias.filter(a => a.estado === 'a tiempo').length;
      const tarde = total - aTiempo;

      setStats({ total, aTiempo, tarde, pctAT: total ? ((aTiempo / total) * 100).toFixed(1) : '0', pctTarde: total ? ((tarde / total) * 100).toFixed(1) : '0' });

      // per-student
      const estStats = ests.map(e => {
        const regs = asistencias.filter(a => a.estudianteId === e.id);
        const at = regs.filter(r => r.estado === 'a tiempo').length;
        return { ...e, totalRegs: regs.length, aTiempo: at, tarde: regs.length - at, pct: regs.length ? ((at / regs.length) * 100).toFixed(1) : '0' };
      });
      setEstudiantes(estStats.filter(e => e.totalRegs > 0).sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Estadísticas de Asistencia</Text>
        <View style={styles.dateRow}>
          <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="Fecha inicio" value={fechaInicio} onChangeText={setFechaInicio} />
          <TextInput style={[styles.input, { flex: 1, marginLeft: 5 }]} placeholder="Fecha fin" value={fechaFin} onChangeText={setFechaFin} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={loadStats}><Text style={styles.btnText}>Actualizar</Text></TouchableOpacity>
      </View>

      {loading && <LoadingSpinner />}

      {stats && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Resumen</Text>
          <Text style={styles.stat}>Total registros: {stats.total}</Text>
          <Text style={[styles.stat, { color: colors.success }]}>A tiempo: {stats.aTiempo} ({stats.pctAT}%)</Text>
          <Text style={[styles.stat, { color: colors.danger }]}>Tarde: {stats.tarde} ({stats.pctTarde}%)</Text>
        </View>
      )}

      {estudiantes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Por Estudiante ({estudiantes.length})</Text>
          {estudiantes.map(e => (
            <View key={e.id} style={styles.studentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{e.codigo} - {e.nombre}</Text>
                <Text style={styles.studentDetail}>Asist: {e.aTiempo}/{e.totalRegs} | Tarde: {e.tarde} | {e.pct}%</Text>
              </View>
              <View style={[styles.pctBadge, { backgroundColor: parseFloat(e.pct) >= 80 ? colors.success : parseFloat(e.pct) >= 50 ? colors.warning : colors.danger }]}>
                <Text style={styles.pctText}>{e.pct}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { backgroundColor: colors.white, margin: 10, borderRadius: 12, padding: 16, elevation: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 10 },
  subtitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 10 },
  dateRow: { flexDirection: 'row', marginBottom: 10 },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, padding: 10, fontSize: 14, backgroundColor: '#FAFAFA' },
  btn: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  stat: { fontSize: 15, marginBottom: 5 },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  studentName: { fontSize: 14, fontWeight: '500' },
  studentDetail: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  pctBadge: { borderRadius: 15, paddingHorizontal: 12, paddingVertical: 4 },
  pctText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
});
