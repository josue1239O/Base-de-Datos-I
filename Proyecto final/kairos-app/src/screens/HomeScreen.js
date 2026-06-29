import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { colors } from '../config/theme';
import { cargarDatos } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomeScreen({ route, navigation }) {
  const { user } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const fechaFormateada = `${dias[new Date().getDay()]}, ${new Date().toLocaleDateString('es-BO')}`;

  const loadData = async () => {
    try {
      const result = await cargarDatos(hoy);
      setData(result);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 10 }}>
          <Text style={{ fontSize: 24, color: '#fff' }}>☰</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Login')} style={{ marginRight: 10 }}>
          <Text style={{ fontSize: 16, color: '#fff' }}>Salir</Text>
        </TouchableOpacity>
      ),
    });
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const total = data?.estudiantes?.length || 0;
  const hoyReg = data?.asistenciaHoy?.length || 0;
  const pct = total > 0 ? Math.round(hoyReg / total * 100) : 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <View style={styles.banner}>
        <Text style={styles.welcome}>Bienvenido, {user?.nombre || 'Usuario'}</Text>
        <Text style={styles.date}>{fechaFormateada}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.rol?.toUpperCase()}</Text></View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Estudiantes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{hoyReg}</Text>
          <Text style={styles.statLabel}>Registros Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: pct < 50 ? '#EF4444' : colors.primary }]}>{pct}%</Text>
          <Text style={styles.statLabel}>Asistencia Hoy</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros de Hoy ({hoyReg})</Text>
        {data?.asistenciaHoy?.length > 0 ? (
          data.asistenciaHoy.slice(0, 10).map((reg, i) => {
            const est = data.estudiantes.find(e => e.id === reg.estudianteId);
            const mat = data.materias.find(m => m.id === reg.materiaId);
            const aTiempo = reg.estado === 'a tiempo';
            return (
              <View key={i} style={styles.recordRow}>
                <View style={[styles.statusDot, { backgroundColor: aTiempo ? '#10B981' : '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordName}>{est?.nombre || 'Desconocido'}</Text>
                  <Text style={styles.recordDetail}>{reg.hora} - {mat?.nombre || 'Sin materia'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: aTiempo ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.recordStatus, { color: aTiempo ? '#065F46' : '#991B1B' }]}>
                    {aTiempo ? 'A tiempo' : 'Tarde'}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No hay registros hoy</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  banner: { backgroundColor: colors.primary, padding: 25, alignItems: 'center' },
  welcome: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 5 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3, marginTop: 8 },
  roleText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: -10, paddingHorizontal: 5 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', flex: 1, margin: 5, elevation: 1 },
  statNumber: { fontSize: 32, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: '#fff', margin: 15, borderRadius: 12, padding: 20, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 10 },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  recordName: { fontSize: 14, fontWeight: '500' },
  recordDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  recordStatus: { fontSize: 12, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#6B7280', padding: 20 },
});
