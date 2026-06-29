import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import EstudiantesScreen from './src/screens/EstudiantesScreen';
import RegistrosScreen from './src/screens/RegistrosScreen';
import MateriasScreen from './src/screens/MateriasScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import EstadisticasScreen from './src/screens/EstadisticasScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import { colors } from './src/config/theme';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const screens = [
  { name: 'Home', component: HomeScreen, title: 'Inicio', label: 'Inicio', roles: null },
  { name: 'Registros', component: RegistrosScreen, title: 'Registrar Asistencia', label: 'Registrar Asistencia', roles: null },
  { name: 'Estudiantes', component: EstudiantesScreen, title: 'Estudiantes', label: 'Estudiantes', roles: null },
  { name: 'Materias', component: MateriasScreen, title: 'Materias', label: 'Materias', roles: null },
  { name: 'Estadisticas', component: EstadisticasScreen, title: 'Estadísticas', label: 'Estadísticas', roles: null },
  { name: 'Reportes', component: ReportesScreen, title: 'Reportes', label: 'Reportes', roles: null },
  { name: 'Usuarios', component: UsuariosScreen, title: 'Usuarios', label: 'Usuarios', roles: ['direccion'] },
];

function CustomDrawerContent(props) {
  const { user } = props;
  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <View style={styles.drawerLogo}>
        <View style={styles.drawerLogoIcon}>
          <Text style={styles.drawerLogoText}>K</Text>
        </View>
        <Text style={styles.drawerLogoTitle}>KAIROS</Text>
      </View>
      <DrawerContentScrollView {...props} style={{ flex: 1 }}>
        {screens
          .filter(s => !s.roles || s.roles.includes(user?.rol))
          .map(s => (
            <TouchableOpacity
              key={s.name}
              style={[
                styles.drawerItem,
                props.state.index === props.state.routeNames.indexOf(s.name) && styles.drawerItemActive,
              ]}
              onPress={() => props.navigation.navigate(s.name)}
            >
              <Text style={[
                styles.drawerItemText,
                props.state.index === props.state.routeNames.indexOf(s.name) && styles.drawerItemTextActive,
              ]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
      </DrawerContentScrollView>
      <TouchableOpacity
        style={styles.drawerLogout}
        onPress={() => props.navigation.getParent()?.navigate('Login')}
      >
        <Text style={styles.drawerLogoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function DrawerNavigator({ route }) {
  const { user } = route.params;
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} user={user} />}
      screenOptions={{
        drawerStyle: { width: 260, backgroundColor: colors.primary },
        headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      {screens
        .filter(s => !s.roles || s.roles.includes(user?.rol))
        .map(s => (
          <Drawer.Screen
            key={s.name}
            name={s.name}
            component={s.component}
            initialParams={{ user }}
            options={{ title: s.title }}
          />
        ))}
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerLogo: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  drawerLogoIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  drawerLogoText: { fontSize: 20, fontWeight: '700', color: colors.white },
  drawerLogoTitle: { fontSize: 20, fontWeight: '700', color: colors.white },
  drawerItem: { paddingVertical: 14, paddingHorizontal: 20 },
  drawerItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  drawerItemText: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  drawerItemTextActive: { color: colors.white, fontWeight: '600' },
  drawerLogout: { margin: 20, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 10, padding: 14, alignItems: 'center' },
  drawerLogoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
