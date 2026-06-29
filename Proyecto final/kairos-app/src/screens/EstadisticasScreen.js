import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import DatePicker from '../components/DatePicker';
import { colors } from '../config/theme';
import { formatDate, today } from '../utils/dates';

export default function EstadisticasScreen({ route }) {
  const { user } = route.params;
  const [periodo, setPeriodo] = useState('mes');
  const [cursoFiltro, setCursoFiltro] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');
  const [fechaStats, setFechaStats] = useState(today());
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [statsData, setStatsData] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const estSnap = await getDocs(collection(db, 'estudiantes'));
      const ests = estSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEstudiantes(ests);

      const matSnap = await getDocs(collection(db, 'materias'));
      const mats = matSnap.docs.map(d => ({ id: d.id, nombre: d.data().nombre }));
      setMaterias(mats);

      const asisSnap = await getDocs(collection(db, 'asistencia'));
      const todos = asisSnap.docs.map(d => d.data());
      const mesStats = fechaStats.substring(0, 7);

      let filtrados = [];
      for (let r of todos) {
        if (periodo === 'dia' && r.fecha !== fechaStats) continue;
        if (periodo === 'mes' && r.fecha.substring(0, 7) !== mesStats) continue;
        filtrados.push(r);
      }

      const totalReg = filtrados.length;
      let presentes = 0, tarde = 0;
      for (let r of filtrados) {
        if (r.estado === 'a tiempo' || r.estado === 'on-time') presentes++;
        else tarde++;
      }

      const cursoDatos = {};
      const estudianteDatos = {};

      for (let r of filtrados) {
        const est = ests.find(e => e.id === r.estudianteId);
        if (!est) continue;

        const cursoKey = (est.curso || '') + '° ' + (est.paralelo || '');
        if (cursoFiltro && cursoKey !== cursoFiltro) continue;
        if (materiaFiltro && r.materiaId !== materiaFiltro) continue;

        if (!cursoDatos[cursoKey]) cursoDatos[cursoKey] = { total: 0, tarde: 0 };
        cursoDatos[cursoKey].total++;
        if (r.estado === 'tarde' || r.estado === 'late') cursoDatos[cursoKey].tarde++;

        if (!estudianteDatos[est.id]) estudianteDatos[est.id] = { nombre: est.nombre, curso: cursoKey, tarde: 0, total: 0, codigo: est.codigo };
        estudianteDatos[est.id].total++;
        if (r.estado === 'tarde' || r.estado === 'late') estudianteDatos[est.id].tarde++;
      }

      const cursosArray = Object.keys(cursoDatos).sort().map(c => ({
        curso: c, total: cursoDatos[c].total, tarde: cursoDatos[c].tarde,
        pct: cursoDatos[c].total > 0 ? Math.round(cursoDatos[c].tarde / cursoDatos[c].total * 100) : 0
      }));

      const estudiantesArray = Object.keys(estudianteDatos).map(id => estudianteDatos[id]);
      estudiantesArray.sort((a, b) => b.tarde - a.tarde);
      const top10 = estudiantesArray.slice(0, 10);

      cursosArray.sort((a, b) => b.pct - a.pct);

      setStatsData({
        total: totalReg, presentes, tarde,
        pctAT: totalReg > 0 ? Math.round(presentes / totalReg * 100) : 0,
        pctTarde: totalReg > 0 ? Math.round(tarde / totalReg * 100) : 0,
        cursosArray, top10, cursosTarde: cursosArray,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const getCursosUnicos = () => {
    const cursos = {};
    for (let e of estudiantes) {
      const c = (e.curso || '') + '° ' + (e.paralelo || '');
      cursos[c] = true;
    }
    return Object.keys(cursos).sort();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estadísticas de Asistencia</Text>
        <View style={styles.filtersRow}>
          <View style={styles.pickerWrap}>
            <Text style={styles.label}>Periodo</Text>
            <Picker selectedValue={periodo} onValueChange={setPeriodo} style={styles.picker}>
              <Picker.Item label="Por Día" value="dia" />
              <Picker.Item label="Por Mes" value="mes" />
              <Picker.Item label="Todo" value="todo" />
            </Picker>
          </View>
          <View style={styles.pickerWrap}>
            <Text style={styles.label}>Curso</Text>
            <Picker selectedValue={cursoFiltro} onValueChange={setCursoFiltro} style={styles.picker}>
              <Picker.Item label="Todos" value="" />
              {getCursosUnicos().map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
          <View style={styles.pickerWrap}>
            <Text style={styles.label}>Materia</Text>
            <Picker selectedValue={materiaFiltro} onValueChange={setMateriaFiltro} style={styles.picker}>
              <Picker.Item label="Todas" value="" />
              {materias.map(m => <Picker.Item key={m.id} label={m.nombre} value={m.id} />)}
            </Picker>
          </View>
          <DatePicker label="Fecha" value={fechaStats} onChange={setFechaStats} />
        </View>
        <TouchableOpacity style={styles.button} onPress={loadStats}>
          <Text style={styles.buttonText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {loading && <LoadingSpinner />}

      {statsData && (
        <>
          <View style={[styles.card, styles.statsRow]}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{statsData.total}</Text>
              <Text style={styles.statLabel}>Registros</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{statsData.pctAT}%</Text>
              <Text style={styles.statLabel}>A Tiempo</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{statsData.pctTarde}%</Text>
              <Text style={styles.statLabel}>Tarde</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Asistencia por Curso</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>Curso</Text>
              <Text style={[styles.th, { flex: 1 }]}>Registros</Text>
              <Text style={[styles.th, { flex: 1 }]}>Tarde</Text>
              <Text style={[styles.th, { flex: 1 }]}>% Tarde</Text>
            </View>
            {statsData.cursosArray.length === 0 ? (
              <Text style={styles.empty}>Sin datos</Text>
            ) : statsData.cursosArray.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1 }]}>{c.curso}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{c.total}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{c.tarde}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{c.pct}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Top Estudiantes con más Tardes</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Nombre</Text>
              <Text style={[styles.th, { flex: 1 }]}>Curso</Text>
              <Text style={[styles.th, { flex: 1 }]}>Tardes</Text>
              <Text style={[styles.th, { flex: 1 }]}>% Tarde</Text>
            </View>
            {statsData.top10.length === 0 ? (
              <Text style={styles.empty}>Sin datos</Text>
            ) : statsData.top10.map((e, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 2 }]}>{e.nombre}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{e.curso}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{e.tarde}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{e.total > 0 ? Math.round(e.tarde / e.total * 100) : 0}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cursos que más llegan Tarde</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>Curso</Text>
              <Text style={[styles.th, { flex: 1 }]}>% Tarde</Text>
            </View>
            {statsData.cursosTarde.length === 0 ? (
              <Text style={styles.empty}>Sin datos</Text>
            ) : statsData.cursosTarde.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1 }]}>{c.curso}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{c.pct}%</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 20, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  pickerWrap: { marginBottom: 8, marginRight: 12, minWidth: 150, flexShrink: 0 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  picker: { height: 44, borderWidth: 2, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center' },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center', padding: 10 },
  statNumber: { fontSize: 32, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 12 },
  th: { fontWeight: '600', fontSize: 13, color: colors.textLight },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12 },
  td: { fontSize: 13, color: colors.text },
  empty: { textAlign: 'center', color: '#666', padding: 20 },
});
