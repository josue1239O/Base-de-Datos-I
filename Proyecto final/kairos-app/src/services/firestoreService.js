import { db } from '../config/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export const cargarDatos = async (hoy) => {
  const resultados = await Promise.all([
    getDocs(collection(db, 'estudiantes')),
    getDocs(query(collection(db, 'asistencia'), where('fecha', '==', hoy))),
    getDoc(doc(db, 'config', 'general')).catch(() => null),
    getDocs(collection(db, 'materias')).catch(() => ({ docs: [], forEach: () => {} })),
  ]);
  const estudiantes = resultados[0].docs.map(d => ({ id: d.id, ...d.data() }));
  const asistenciaHoy = resultados[1].docs.map(d => ({ id: d.id, ...d.data() }));
  const config = resultados[2]?.data() || { horaLimite: '07:30', toleranciaMinutos: 15 };
  const materias = resultados[3].docs ? resultados[3].docs.map(d => ({ id: d.id, ...d.data() })) : [];
  return { estudiantes, asistenciaHoy, config, materias };
};

export const getEstudiantes = async () => {
  const snap = await getDocs(collection(db, 'estudiantes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAsistenciaByFecha = async (fecha) => {
  const snap = await getDocs(query(collection(db, 'asistencia'), where('fecha', '==', fecha)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAsistenciaByEstudiante = async (estudianteId) => {
  const snap = await getDocs(query(collection(db, 'asistencia'), where('estudianteId', '==', estudianteId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getMaterias = async () => {
  const snap = await getDocs(collection(db, 'materias'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addMateria = async (nombre) => {
  const ref = await addDoc(collection(db, 'materias'), { nombre });
  return ref.id;
};

export const deleteMateria = async (id) => {
  await deleteDoc(doc(db, 'materias', id));
};

export const getUsuarios = async () => {
  const snap = await getDocs(collection(db, 'usuarios'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const deleteUsuario = async (uid) => {
  await deleteDoc(doc(db, 'usuarios', uid));
};

export const getEstudianteByCodigo = async (codigo) => {
  const snap = await getDocs(query(collection(db, 'estudiantes'), where('codigo', '==', codigo)));
  if (!snap.empty) {
    const est = { id: snap.docs[0].id, ...snap.docs[0].data() };
    const asistencias = await getAsistenciaByEstudiante(est.id);
    return { estudiante: est, asistencias };
  }
  return null;
};

export const addAsistencia = async (data) => {
  await addDoc(collection(db, 'asistencia'), data);
};

export const updateConfig = async (horaLimite, tolerancia) => {
  await setDoc(doc(db, 'config', 'general'), { horaLimite, toleranciaMinutos: tolerancia }, { merge: true });
};

export const addEstudiante = async (data) => {
  const ref = await addDoc(collection(db, 'estudiantes'), data);
  return ref.id;
};

export const deleteEstudiante = async (id) => {
  await deleteDoc(doc(db, 'estudiantes', id));
};
