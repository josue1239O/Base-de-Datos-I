import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../services/authService';
import { getEstudianteByCodigo } from '../services/firestoreService';
import { colors } from '../config/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [parentData, setParentData] = useState(null);
  const [showParent, setShowParent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parentLoading, setParentLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Ingresa correo y contraseña'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      navigation.replace('Main', { user });
    } catch (e) {
      Alert.alert('Error', 'Credenciales inválidas');
    }
    setLoading(false);
  };

  const handleParentQuery = async () => {
    if (!parentCode) { Alert.alert('Error', 'Ingresa un código'); return; }
    setParentLoading(true);
    try {
      const result = await getEstudianteByCodigo(parentCode);
      if (!result) { Alert.alert('Error', 'Código no encontrado'); setParentData(null); setParentLoading(false); return; }
      const { estudiante, asistencias } = result;
      const totalRegistros = asistencias.length;
      const aTiempo = asistencias.filter(a => a.estado === 'a tiempo').length;
      const porcentaje = totalRegistros > 0 ? Math.round(aTiempo / totalRegistros * 100) : 0;
      const tardes = asistencias.filter(a => a.estado === 'tarde').length;
      const hoy = new Date().toISOString().split('T')[0];
      const hoyReg = asistencias.find(a => a.fecha === hoy);
      setParentData({ estudiante, asistencias, porcentaje, tardes, totalRegistros, hoyReg });
    } catch (e) {
      Alert.alert('Error', 'Error al consultar');
    }
    setParentLoading(false);
  };

  if (showParent) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={[styles.logoCircle, { backgroundColor: colors.success }]}>
              <Text style={{ fontSize: 28, color: colors.white }}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>Padres</Text>
            <Text style={styles.subtitle}>Consulta la asistencia de tu hijo</Text>
            <TextInput style={[styles.input, { textAlign: 'center', fontSize: 20, letterSpacing: 3 }]} placeholder="Ej: K0001" value={parentCode} onChangeText={setParentCode} autoCapitalize="characters" />
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.success }]} onPress={handleParentQuery} disabled={parentLoading}>
              <Text style={styles.buttonText}>{parentLoading ? 'Consultando...' : 'Consultar'}</Text>
            </TouchableOpacity>
            {parentData && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.infoText, { fontSize: 16, fontWeight: 'bold', textAlign: 'center' }]}>{parentData.estudiante.nombre}</Text>
                <Text style={styles.infoText}>Código: {parentData.estudiante.codigo}</Text>
                <Text style={styles.infoText}>Curso: {parentData.estudiante.curso} {parentData.estudiante.paralelo}</Text>
                {parentData.hoyReg ? (
                  <Text style={[styles.statusBadge, { backgroundColor: '#D1FAE5', color: '#065F46', padding: 8, borderRadius: 8, marginVertical: 5, textAlign: 'center', fontWeight: '600' }]}>
                    Hoy: {parentData.hoyReg.estado === 'a tiempo' ? 'A tiempo' : 'Tarde'} ({parentData.hoyReg.hora})
                  </Text>
                ) : (
                  <Text style={[styles.statusBadge, { backgroundColor: '#FEE2E2', color: '#991B1B', padding: 8, borderRadius: 8, marginVertical: 5, textAlign: 'center', fontWeight: '600' }]}>Hoy: Sin registro</Text>
                )}
                <View style={styles.statRow}>
                  <View style={styles.statItem}><Text style={styles.statNumber}>{parentData.porcentaje}%</Text><Text style={styles.statLabel}>Asistencia</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNumber}>{parentData.totalRegistros}</Text><Text style={styles.statLabel}>Registros</Text></View>
                  <View style={styles.statItem}><Text style={[styles.statNumber, { color: parentData.tardes > 3 ? colors.danger : colors.primary }]}>{parentData.tardes}</Text><Text style={styles.statLabel}>Tardes</Text></View>
                </View>
                {parentData.porcentaje < 50 && (
                  <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginTop: 10 }}>
                    <Text style={{ color: '#991B1B', fontWeight: 'bold', textAlign: 'center' }}>Asistencia crítica: menos del 50%</Text>
                  </View>
                )}
                {parentData.porcentaje >= 50 && parentData.porcentaje < 75 && (
                  <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginTop: 10 }}>
                    <Text style={{ color: '#92400E', fontWeight: 'bold', textAlign: 'center' }}>Asistencia baja: menos del 75%</Text>
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity onPress={() => { setShowParent(false); setParentData(null); }} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.accent, fontSize: 14 }}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🏫</Text>
          </View>
          <Text style={styles.cardTitle}>KAIROS</Text>
          <Text style={styles.subtitle}>Control de Asistencia</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Correo</Text>
            <TextInput style={styles.input} placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput style={styles.input} placeholder="********" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>PORTAL DE PADRES</Text>
            <View style={styles.dividerLine} />
          </View>
          <Text style={styles.parentHint}>¿Eres padre o tutor?</Text>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent, padding: 12 }]} onPress={() => setShowParent(true)}>
            <Text style={styles.buttonText}>Consultar Asistencia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryDark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 48, width: '100%', maxWidth: 540, alignSelf: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  logoIcon: { fontSize: 36 },
  cardTitle: { color: colors.primary, textAlign: 'center', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { textAlign: 'center', color: colors.textLight, marginBottom: 32, fontSize: 16 },
  formGroup: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: '600', fontSize: 13, color: colors.text },
  input: { width: '100%', padding: 12, borderWidth: 2, borderColor: colors.border, borderRadius: 10, fontSize: 15, backgroundColor: '#FAFAFA', color: colors.text },
  button: { width: '100%', padding: 15, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: colors.textLight, fontWeight: 'bold', letterSpacing: 1 },
  parentHint: { fontSize: 13, color: colors.textLight, textAlign: 'center', marginBottom: 8 },
  infoText: { fontSize: 14, color: colors.text, marginVertical: 2, textAlign: 'center' },
  statusBadge: { fontWeight: '600' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textLight, marginTop: 2 },
});
