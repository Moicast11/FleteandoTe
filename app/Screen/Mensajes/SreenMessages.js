import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

export default function SreenMessages() {
  const navigation = useNavigation();

  // Datos de ejemplo - En el futuro los traerás de tu API
  const chatsEjemplo = [
    { 
      id: '1', 
      fleteId: 101, // ID del flete en tu DB
      receptorId: 5,  // ID del transportista (ej. Mototaxi)
      nombre: 'Juan Pérez (Fletero)', 
      ultimoMsj: 'Ya voy en camino con el refrigerador.' 
    },
    { 
      id: '2', 
      fleteId: 102, 
      receptorId: 8, 
      nombre: 'Soporte FleteandoTe', 
      ultimoMsj: 'Tu pedido ha sido confirmado.' 
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Mensajes</Text>
      
      <FlatList
        data={chatsEjemplo}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem}
            onPress={() => {
              console.log("Presionaste a:", item.nombre); // Esto imprimirá en tu terminal de VS Code
              navigation.navigate('ChatDetail', {
                fleteId: item.fleteId,
                receptorId: item.receptorId,
                nombreReceptor: item.nombre
              });
            }}
          >
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.mensaje}>{item.ultimoMsj}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 20, 
    paddingTop: 50 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#333' 
  },
  chatItem: { 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  nombre: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#007AFF' 
  },
  mensaje: { 
    color: '#666', 
    marginTop: 5 
  }
});