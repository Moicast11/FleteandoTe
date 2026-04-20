import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { createStackNavigator } from '@react-navigation/stack';
import { EstadoGlobalContext } from './Context/EstadoGlobalUser';

const Tab = createBottomTabNavigator();

//aÃ±adimiento de las diferentes pantallas
import ScreenLogin from './Screen/login/ScreenLogin';
import ScreenHomeUsers from './Screen/Home/ScreenHomeUsers';
import ScreenHomeDelivery from './Screen/Home/ScreenHomeDelivery';
import ScreenTransportes from './Screen/Transportes/ScreenTransportes';
import ScreenHistorial from './Screen/Historial/ScreenHistorial';
import ScreenRegisterUser from './Screen/login/ScreenRegisterUser';
import ScreenRegisterTransportista from './Screen/login/ScreenRegisterTransportista';
import ScreenSettings from './Screen/Setting/ScreenSettings';
import ScreenMaops from './Screen/Map/ScreenMaps';
import ScreenPedido from './Screen/Pedido/ScreenPedido';
import SreenMessages from './Screen/Mensajes/SreenMessages';
import ChatScreen from './Screen/Mensajes/ScreenChat';

const Stack = createStackNavigator();

export default function MyNavigation() {
  return (
    <Tab.Navigator>

      <Tab.Screen name="inicio"
        component={MyStackHome}
        options={{
          headerShown: false,
          //title: 'login',
          tabBarIcon: ({ color, size }) =>
            <FontAwesome name="home" size={size} color={color} />
        }}
      />
      <Tab.Screen name='historial' component={HistorialStackScreen} options={{
        headerShown: false,
        title: 'Historial',
        tabBarIcon: ({ color, size }) =>
          <FontAwesome name="history" size={24} color="#555" />
      }} />

      <Tab.Screen name="configuracion"
        component={Configuracion}
        options={{
          headerShown: false,
          //title: 'login',
          tabBarIcon: ({ color, size }) =>
            <FontAwesome name="cog" size={size} color={color} />
        }}
      />
      <Tab.Screen name="Mapa" component={MyStackMaps} options={{
        headerShown: false,
        title: 'Mapa',
        tabBarIcon: ({ color, size }) =>
          <FontAwesome name="map" size={24} color="#555" />
      }} />

      {/* Tab de mensajes modificado para usar el Stack */}
      <Tab.Screen name="mensajes"
        component={MessagesStackScreen}
        options={{
          headerShown: false,
          title: 'Mensajes',
          tabBarIcon: ({ color, size }) =>
            <FontAwesome name="comment" size={size} color={color} />
        }}
      />

    </Tab.Navigator>

  )
}

export function MyStackLogin() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='login' component={ScreenLogin} options={{ title: 'login', headerShown: false, animation: 'slide_from_left' }} />
      <Stack.Screen name='registeruser' component={ScreenRegisterUser} options={{ title: 'register user', headerShown: false }} />
      <Stack.Screen name='registertransportista' component={ScreenRegisterTransportista} options={{ title: 'register transportista', headerShown: false }} />
    </Stack.Navigator>
  )
}

function MyStackMaps() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='mapa' component={ScreenMaops} options={{ title: 'Mapa', headerShown: false }} />
      <Stack.Screen name='pedido' component={ScreenPedido} options={{ title: 'Subir pedido', headerShown: false }} />
    </Stack.Navigator>
  )
}

function Configuracion() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="test" component={ScreenSettings} options={{ title: 'test', headerShown: false }} />
    </Stack.Navigator>
  )
}

function HistorialStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="historialscreen" component={ScreenHistorial} options={{ title: 'Historial', headerShown: false }} />
    </Stack.Navigator>
  )
}

// Nueva función para manejar el flujo de mensajes
function MessagesStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MessagesList" 
        component={SreenMessages} 
        options={{ title: 'Mis Mensajes', headerShown: false }} 
      />
      <Stack.Screen 
        name="ChatDetail" 
        component={ChatScreen} 
        options={{ title: 'Chat', headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

function MyStackHome() {
  const { transportista } = useContext(EstadoGlobalContext);

  return (
    <Stack.Navigator initialRouteName='menustack'>
      <Stack.Screen
        name="menustack"
        component={transportista ? ScreenHomeDelivery : ScreenHomeUsers}
        options={{ title: 'dashboard', headerShown: false }}
      />
    </Stack.Navigator>
  )
}