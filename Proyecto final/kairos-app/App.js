import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';

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
    <View style={{ flex: 1, backgroundColor: '#1e3a5f', paddingTop: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 20 }}>
        <Image source={require('./assets/icon.png')} style={{ width: 40, height: 40, borderRadius: 10, marginRight: 12 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>KAIROS</Text>
      </View>
      <DrawerContentScrollView {...props} style={{ flex: 1 }}>
        {screens.filter(s => !s.roles || s.roles.includes(user?.rol)).map(s => (
          <TouchableOpacity
            key={s.name}
            style={[
              { paddingVertical: 14, paddingHorizontal: 20 },
              props.state.index === props.state.routeNames.indexOf(s.name) && { backgroundColor: 'rgba(255,255,255,0.15)' }
            ]}
            onPress={() => props.navigation.navigate(s.name)}
          >
            <Text style={[
              { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
              props.state.index === props.state.routeNames.indexOf(s.name) && { color: '#fff', fontWeight: '600' }
            ]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>
      <TouchableOpacity
        style={{ margin: 20, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 10, padding: 14, alignItems: 'center' }}
        onPress={() => props.navigation.getParent()?.navigate('Login')}
      >
        <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 15 }}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function DrawerNavigator({ route }) {
  const { user } = route.params;
  const { width } = useWindowDimensions();
  const isLarge = width >= 900;
  return (
    <View style={{ flex: 1 }}>
      {!isLarge && (
        <View style={{ height: 50, backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <Image source={require('./assets/icon.png')} style={{ width: 28, height: 28, borderRadius: 6, marginRight: 8 }} />
          <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>KAIROS</Text>
        </View>
      )}
      <Drawer.Navigator
        initialRouteName="Home"
        drawerContent={(props) => <CustomDrawerContent {...props} user={user} />}
        screenOptions={{
          headerShown: false,
          drawerType: isLarge ? 'permanent' : 'front',
          drawerStyle: { width: 260 },
          swipeEnabled: !isLarge,
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
            />
          ))}
      </Drawer.Navigator>
    </View>
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
