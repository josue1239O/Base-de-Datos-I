import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { colors } from '../config/theme';

export default function ReportesScreen({ route }) {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('');

  const generateReport = async (type) => {
    setLoading(true);
    setReportType(type);
    try {
      const estSnap = await getDocs(collection(db, 'estudiantes'));
      const estudiantes = estSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (type === 'diaria') {
        const hoy = new Date().toISOString().split('T')[0];
        const asisSnap = await getDocs(query(collection(db, 'asistencia'), where('fecha', '==', hoy)));
        const asistencias = asisSnap.docs.map(d => d.data());
        const aTiempo = asistencias.filter(a => a.estado === 'a tiempo').length;
        setReportData({
          title: 'Asistencia Diaria (' + hoy + ')',
          items: [
            { label: 'Total registros', value: asistencias.length },
            { label: 'A tiempo', value: aTiempo },
            { label: 'Tarde', value: asistencias.length - aTiempo },
          ]
        });
      } else if (type === 'sin_registro') {
        const asisSnap = await getDocs(collection(db, 'asistencia'));
        const idsConRegistro = new Set(asisSnap.docs.map(d => d.data().estudianteId));
        const sinRegistro = estudiantes.filter(e => !idsConRegistro.has(e.id));
        setReportData({
          title: 'Estudiantes sin registro de asistencia',
          items: sinRegistro.map(e => ({ label: e.codigo + ' - ' + e.nombre, value: 'Sin asistencias' })),
          emptyMsg: sinRegistro.length === 0 ? 'Todos los estudiantes tienen al menos un registro' : null,
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Reportes</Text>
        <TouchableOpacity style={styles.reportBtn} onPress={() => generateReport('diaria')}>
          <Text style={styles.reportBtnText}>Asistencia Diaria</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reportBtn} onPress={() => generateReport('sin_registro')}>
          <Text style={styles.reportBtnText}>Estudiantes sin Registro</Text>
        </TouchableOpacity>
      </View>

      {loading && <LoadingSpinner />}

      {reportData && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>{reportData.title}</Text>
          {reportData.items && reportData.items.length > 0 ? reportData.items.map((item, i) => (
            <View key={i} style={styles.reportRow}>
              <Text style={styles.reportLabel}>{item.label}</Text>
              <Text style={styles.reportValue}>{item.value}</Text>
            </View>
          )) : (
            <Text style={styles.empty}>{reportData.emptyMsg || 'Sin datos'}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { backgroundColor: colors.white, margin: 10, borderRadius: 12, padding: 16, elevation: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: colors.primary },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: colors.primary },
  reportBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, marginBottom: 10, alignItems: 'center' },
  reportBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  reportLabel: { fontSize: 14, flex: 1 },
  reportValue: { fontSize: 14, fontWeight: '700', color: colors.primary },
  empty: { textAlign: 'center', color: colors.textLight, padding: 20 },
});
