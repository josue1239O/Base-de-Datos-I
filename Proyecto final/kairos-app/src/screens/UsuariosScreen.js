import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../config/theme';

const API_KEY = 'AIzaSyDHPbQL0Ii8BwJZJpyRzf7Eor9afmjeF6w';

export default function UsuariosScreen({ route }) {
  const { user } = route.params;
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('profesor');
  const canEdit = user?.rol === 'direccion';

  const loadData = async () => {
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      setUsuarios(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleDelete = (uid, nombreUsr) => {
    if (uid === user.uid) { Alert.alert('Error', 'No puedes eliminarte a ti mismo'); return; }
    Alert.alert('Eliminar', `¿Eliminar a ${nombreUsr}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'usuarios', uid));
        loadData();
      }},
    ]);
  };

  const handleCreate = async () => {
    if (!nombre || !email || !password) { Alert.alert('Error', 'Todos los campos requeridos'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Mínimo 6 caracteres'); return; }
    try {
      const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const data = await resp.json();
      if (data.error) { Alert.alert('Error', data.error.message); return; }
      await setDoc(doc(db, 'usuarios', data.localId), { email, nombre, rol });
      Alert.alert('Éxito', 'Usuario creado correctamente');
      setNombre(''); setEmail(''); setPassword(''); setRol('profesor');
      loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      {canEdit && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear Usuario</Text>
          <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Contraseña (mín. 6 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
          <View style={styles.rolRow}>
            {['profesor', 'regente', 'direccion'].map(r => (
              <TouchableOpacity key={r} style={[styles.rolBtn, rol === r && styles.rolActive]} onPress={() => setRol(r)}>
                <Text style={[styles.rolText, rol === r && styles.rolTextActive]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate}><Text style={styles.createBtnText}>Crear Usuario</Text></TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usuarios ({usuarios.length})</Text>
        {usuarios.map(u => (
          <View key={u.uid} style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{u.nombre || u.email}</Text>
              <Text style={styles.userEmail}>{u.email} - {u.rol}</Text>
            </View>
            {canEdit && u.uid !== user.uid && (
              <TouchableOpacity onPress={() => handleDelete(u.uid, u.nombre)}>
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: { backgroundColor: colors.white, borderRadius: 12, padding: 16, elevation: 1, margin: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 10 },
  input: { borderWidth: 2, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA', padding: 10, fontSize: 14, marginBottom: 8 },
  rolRow: { flexDirection: 'row', marginBottom: 10 },
  rolBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginRight: 6, backgroundColor: '#E5E7EB' },
  rolActive: { backgroundColor: colors.primary },
  rolText: { fontSize: 13, color: '#666' },
  rolTextActive: { color: colors.white, fontWeight: 'bold' },
  createBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  createBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  userName: { fontSize: 15, fontWeight: '500' },
  userEmail: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});
