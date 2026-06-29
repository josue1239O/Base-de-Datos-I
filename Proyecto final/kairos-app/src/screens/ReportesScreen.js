import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors } from '../config/theme';

export default function ReportesScreen({ route }) {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);
  const [minPct, setMinPct] = useState(50);
  const [reportData, setReportData] = useState(null);

  const generarReporte = async () => {
    setLoading(true);
    try {
      const estSnap = await getDocs(collection(db, 'estudiantes'));
      const estudiantes = estSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const matSnap = await getDocs(collection(db, 'materias'));
      const materias = matSnap.docs.map(d => ({ id: d.id, nombre: d.data().nombre }));

      const asisSnap = await getDocs(collection(db, 'asistencia'));
      const asistencias = asisSnap.docs.map(d => d.data());

      const todos = {};
      for (let a of asistencias) {
        if (!todos[a.estudianteId]) todos[a.estudianteId] = { total: 0, tarde: 0, materiaIds: {} };
        todos[a.estudianteId].total++;
        if (a.estado === 'tarde' || a.estado === 'late') todos[a.estudianteId].tarde++;
        if (a.materiaId) todos[a.estudianteId].materiaIds[a.materiaId] = true;
      }

      const bajos = [];
      for (let eid in todos) {
        const d = todos[eid];
        const pct = d.total > 0 ? Math.round((d.total - d.tarde) / d.total * 100) : 100;
        if (pct < minPct) {
          const est = estudiantes.find(e => e.id === eid);
          if (est) {
            const materiaNombres = Object.keys(d.materiaIds).map(mid => {
              const m = materias.find(mat => mat.id === mid);
              return m ? m.nombre : '';
            }).filter(Boolean).join(', ');
            bajos.push({
              nombre: est.nombre,
              curso: (est.curso || '') + '° ' + (est.paralelo || ''),
              codigo: est.codigo,
              total: d.total,
              tarde: d.tarde,
              pct,
              tutor: est.tutor || '',
              email: est.email || '',
              materias: materiaNombres,
            });
          }
        }
      }

      bajos.sort((a, b) => a.pct - b.pct);
      setReportData({ bajos, minPct });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estudiantes con Bajo Rendimiento</Text>
        <Text style={{ color: colors.textLight, marginBottom: 16, fontSize: 14 }}>
          Selecciona un mínimo de asistencia para filtrar estudiantes que necesitan atención.
        </Text>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Asistencia menor a:</Text>
          {[25, 50, 75].map(p => (
            <TouchableOpacity key={p} style={[styles.filterBtn, minPct === p && styles.filterActive]} onPress={() => setMinPct(p)}>
              <Text style={[styles.filterText, minPct === p && styles.filterTextActive]}>{p}%</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.button, { marginLeft: 12, paddingVertical: 10, paddingHorizontal: 20 }]} onPress={generarReporte}>
            <Text style={styles.buttonText}>Generar Reporte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <LoadingSpinner />}

      {reportData && (
        <View style={styles.card}>
          {reportData.bajos.length === 0 ? (
            <Text style={{ color: colors.success, fontSize: 15, textAlign: 'center', padding: 20 }}>
              No hay estudiantes con asistencia menor al {reportData.minPct}%.
            </Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Nombre</Text>
                <Text style={[styles.th, { flex: 1 }]}>Curso</Text>
                <Text style={[styles.th, { flex: 1 }]}>Código</Text>
                <Text style={[styles.th, { flex: 1 }]}>Tutor</Text>
                <Text style={[styles.th, { flex: 1 }]}>Asistencia</Text>
              </View>
              {reportData.bajos.map((b, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 2 }]}>{b.nombre}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{b.curso}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{b.codigo || '-'}</Text>
                  <Text style={[styles.td, { flex: 1, fontSize: 12 }]}>{b.tutor || '-'}</Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: 'bold', color: colors.danger }]}>{b.pct}%</Text>
                </View>
              ))}
              <View style={{ marginTop: 16, padding: 14, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
                <Text style={{ color: '#92400E', fontSize: 13, textAlign: 'center' }}>
                  <Text style={{ fontWeight: 'bold' }}>{reportData.bajos.length}</Text> estudiantes con asistencia menor al {reportData.minPct}%. Los padres pueden ver este reporte al consultar el código de su hijo en la pantalla de inicio.
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  filterLabel: { fontWeight: '600', marginRight: 8, fontSize: 13, color: colors.text },
  filterBtn: { backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginRight: 6, marginBottom: 4 },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textLight },
  filterTextActive: { color: colors.white, fontWeight: 'bold' },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12 },
  th: { fontWeight: '600', fontSize: 13, color: colors.textLight },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12 },
  td: { fontSize: 13, color: colors.text },
});
