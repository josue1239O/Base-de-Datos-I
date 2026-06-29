import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { login } from '../services/authService';
import { getEstudianteByCodigo } from '../services/firestoreService';
import { colors } from '../config/theme';

const clr = {
  primary: '#1e3a5f',
  primaryDark: '#152a45',
  accent: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
  bg: '#F3F4F6',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
};

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
            <View style={[styles.parentLogoCircle, { backgroundColor: clr.success }]}>
              <Text style={{ fontSize: 28, color: clr.white }}>👤</Text>
            </View>
            <Text style={[styles.parentTitle, { color: clr.primary }]}>Padres</Text>
            <Text style={[styles.parentSubtitle, { color: clr.textLight }]}>Consulta la asistencia de tu hijo</Text>
            <TextInput style={[styles.input, { textAlign: 'center', fontSize: 20, letterSpacing: 3 }]} placeholder="Ej: K0001" value={parentCode} onChangeText={setParentCode} autoCapitalize="characters" />
            <TouchableOpacity style={[styles.button, { backgroundColor: clr.success }]} onPress={handleParentQuery} disabled={parentLoading}>
              <Text style={styles.buttonText}>{parentLoading ? 'Consultando...' : 'Consultar'}</Text>
            </TouchableOpacity>
            {parentData && (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.infoText, { fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: clr.text }]}>{parentData.estudiante.nombre}</Text>
                <Text style={[styles.infoText, { color: clr.text }]}>Código: {parentData.estudiante.codigo}</Text>
                <Text style={[styles.infoText, { color: clr.text }]}>Curso: {parentData.estudiante.curso} {parentData.estudiante.paralelo}</Text>
                {parentData.hoyReg ? (
                  <Text style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: 8, borderRadius: 8, marginVertical: 5, textAlign: 'center', fontWeight: '600' }}>
                    Hoy: {parentData.hoyReg.estado === 'a tiempo' ? 'A tiempo' : 'Tarde'} ({parentData.hoyReg.hora})
                  </Text>
                ) : (
                  <Text style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: 8, borderRadius: 8, marginVertical: 5, textAlign: 'center', fontWeight: '600' }}>Hoy: Sin registro</Text>
                )}
                <View style={styles.statRow}>
                  <View style={styles.statItem}><Text style={styles.statNumber}>{parentData.porcentaje}%</Text><Text style={styles.statLabel}>Asistencia</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNumber}>{parentData.totalRegistros}</Text><Text style={styles.statLabel}>Registros</Text></View>
                  <View style={styles.statItem}><Text style={[styles.statNumber, { color: parentData.tardes > 3 ? clr.danger : clr.primary }]}>{parentData.tardes}</Text><Text style={styles.statLabel}>Tardes</Text></View>
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
              <Text style={{ color: clr.accent, fontSize: 14, textAlign: 'center' }}>Volver al inicio de sesión</Text>
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
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
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
          <TouchableOpacity style={[styles.parentButton]} onPress={() => setShowParent(true)}>
            <Text style={styles.buttonText}>Consultar Asistencia</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#152a45' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, paddingVertical: 48, paddingHorizontal: 44, width: '100%', maxWidth: 540, alignSelf: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 40 },
  logoImage: { width: 80, height: 80, borderRadius: 40, alignSelf: 'center', marginBottom: 24 },
  cardTitle: { color: '#1e3a5f', textAlign: 'center', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { textAlign: 'center', color: '#6B7280', marginBottom: 32, fontSize: 16 },
  formGroup: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: '600', fontSize: 13, color: '#1F2937' },
  input: { width: '100%', padding: 12, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 10, fontSize: 15, backgroundColor: '#FAFAFA', color: '#1F2937' },
  button: { width: '100%', padding: 15, backgroundColor: '#1e3a5f', borderRadius: 10, alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 10, fontSize: 12, color: '#6B7280', fontWeight: 'bold', letterSpacing: 1 },
  parentHint: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 8 },
  parentButton: { width: '100%', padding: 12, backgroundColor: '#3B82F6', borderRadius: 10, alignItems: 'center' },
  parentLogoCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 24 },
  parentTitle: { fontSize: 28, textAlign: 'center', fontWeight: 'bold', marginBottom: 8 },
  parentSubtitle: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  infoText: { fontSize: 14, marginVertical: 2, textAlign: 'center' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '700', color: '#1e3a5f' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
