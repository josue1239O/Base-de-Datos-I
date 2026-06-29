import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../config/theme';
import { cargarDatos } from '../services/firestoreService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/dates';

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
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const total = data?.estudiantes?.length || 0;
  const hoyReg = data?.asistenciaHoy?.length || 0;
  const pct = total > 0 ? Math.round(hoyReg / total * 100) : 0;

  const logout = () => navigation.getParent()?.navigate('Login');

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <LinearGradient colors={['#1e3a5f', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <Text style={styles.welcome}>Bienvenido, {user?.nombre || 'Usuario'}</Text>
        <Text style={styles.subtitle}>{user?.rol || 'Usuario'} • {fechaFormateada}</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </LinearGradient>

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
          <Text style={styles.statNumber}>{pct}%</Text>
          <Text style={styles.statLabel}>Asistencia Hoy</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros de {formatDate(hoy)} ({hoyReg})</Text>
        {data?.asistenciaHoy?.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { flex: 1 }]}>Estudiante</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Materia</Text>
              <Text style={[styles.headerText, { width: 70, textAlign: 'center' }]}>Hora</Text>
              <Text style={[styles.headerText, { width: 85, textAlign: 'center' }]}>Estado</Text>
            </View>
            {data.asistenciaHoy.slice(0, 10).map((reg, i) => {
              const est = data.estudiantes.find(e => e.id === reg.estudianteId);
              const mat = data.materias.find(m => m.id === reg.materiaId);
              const aTiempo = reg.estado === 'a tiempo';
              return (
                <View key={i} style={styles.dataRow}>
                  <Text style={[styles.cellText, { flex: 1 }]}>{est?.nombre || 'Desconocido'}</Text>
                  <Text style={[styles.cellText, { flex: 1 }]}>{mat?.nombre || 'Sin materia'}</Text>
                  <Text style={[styles.cellText, { width: 70, textAlign: 'center' }]}>{reg.hora}</Text>
                  <View style={{ width: 85, alignItems: 'center' }}>
                    <View style={[styles.badge, { backgroundColor: aTiempo ? '#D1FAE5' : '#FEE2E2' }]}>
                      <Text style={[styles.badgeText, { color: aTiempo ? '#065F46' : '#991B1B' }]}>
                        {aTiempo ? 'A tiempo' : 'Tarde'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.emptyText}>No hay registros hoy</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { borderRadius: 16, padding: 32, paddingHorizontal: 24, marginBottom: 24, marginHorizontal: 16, marginTop: 16 },
  welcome: { fontSize: 28, fontWeight: '700', color: colors.white, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.white, opacity: 0.9 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 16 },
  logoutText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginHorizontal: 16 },
  statCard: { backgroundColor: colors.white, padding: 20, borderRadius: 12, alignItems: 'center', flex: 1, marginHorizontal: 4, elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: '700', color: colors.primary },
  statLabel: { color: colors.textLight, fontSize: 14, marginTop: 4 },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 20, marginHorizontal: 16 },
  sectionTitle: { color: colors.primary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  tableHeader: { backgroundColor: '#F9FAFB', flexDirection: 'row', padding: 12, borderRadius: 8 },
  headerText: { fontWeight: '600', fontSize: 13, color: colors.textLight },
  dataRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  cellText: { fontSize: 14, color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#666', padding: 20 },
});
