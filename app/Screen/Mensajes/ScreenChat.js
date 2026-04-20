import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { getApiBaseUrl } from '../../services/apiConfig';
import { EstadoGlobalContext } from '../../Context/EstadoGlobalUser';

export default function ChatScreen({ route }) {
  const { fleteId, receptorId, nombreReceptor } = route.params;
  const { usuario } = useContext(EstadoGlobalContext);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // 🔴 PASO 4: Cargar mensajes reales del backend
  useEffect(() => {
    console.log('📱 ChatScreen montado');
    console.log('  - fleteId:', fleteId);
    console.log('  - receptorId:', receptorId);
    console.log('  - nombreReceptor:', nombreReceptor);
    console.log('  - usuario:', usuario);
    
    if (!usuario?.usuario_id) {
      setError('Usuario no identificado. Por favor, inicia sesión nuevamente.');
      setCargando(false);
      return;
    }
    
    obtenerMensajes();
  }, [fleteId, usuario?.usuario_id]);

  const obtenerMensajes = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/mensajes/${fleteId}`;
      
      console.log('🔵 Cargando mensajes desde:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data).substring(0, 200));

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${data.message || 'No especificado'}`);
      }
      
      // 🔵 Mapear correctamente los mensajes del backend
      if (data.ok && data.data && Array.isArray(data.data)) {
        const mensajesMapeados = data.data.map(msg => ({
          id: msg.id || msg.mensaje_id,
          texto: msg.mensaje,
          remitente: msg.emisor_id === usuario?.usuario_id ? 'yo' : 'otro',
          timestamp: new Date(msg.fecha_envio),
          emisorId: msg.emisor_id
        }));
        console.log('✅ Mensajes cargados:', mensajesMapeados.length);
        setMensajes(mensajesMapeados);
      } else if (data.ok) {
        console.log('ℹ️ No hay mensajes o formato diferente');
        setMensajes([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar mensajes:', err);
      setError(`Error: ${err.message}`);
      setMensajes([]);
    } finally {
      setCargando(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    if (!usuario?.usuario_id) {
      Alert.alert('Error', 'Usuario no identificado');
      return;
    }

    try {
      setEnviando(true);
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/enviar-mensaje`;
      
      console.log('📤 Enviando mensaje a:', url);
      console.log('  - Datos:', { flete_id: fleteId, emisor_id: usuario.usuario_id, receptor_id: receptorId, mensaje: nuevoMensaje });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flete_id: fleteId,
          emisor_id: usuario.usuario_id,
          receptor_id: receptorId,
          mensaje: nuevoMensaje
        })
      });

      const data = await response.json();
      console.log('Response:', response.status, data);

      if (response.ok) {
        setNuevoMensaje('');
        // Recargar mensajes para ver el nuevo
        obtenerMensajes();
      } else {
        Alert.alert('Error', data.message || 'No se pudo enviar el mensaje');
      }
    } catch (err) {
      console.error('❌ Error al enviar:', err);
      Alert.alert('Error', err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔵 ENCABEZADO */}
      <View style={styles.header}>
        <Text style={styles.nombreChat}>{nombreReceptor}</Text>
        <Text style={styles.subtitulo}>Flete #{fleteId}</Text>
      </View>

      {/* 🟢 MOSTRAR MENSAJES O ERROR */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.textoGris}>Cargando mensajes...</Text>
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.botonReintento} onPress={obtenerMensajes}>
            <Text style={styles.textoBotonReintento}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={mensajes}
          keyExtractor={item => (item.id || Math.random()).toString()}
          renderItem={({ item }) => (
            <View style={[
              styles.mensajeContainer,
              item.remitente === 'yo' ? styles.mensajeYo : styles.mensajeOtro
            ]}>
              <Text style={[
                styles.textoMensaje,
                item.remitente === 'yo' ? styles.textoMensajeYo : styles.textoMensajeOtro
              ]}>
                {item.texto}
              </Text>
            </View>
          )}
          inverted
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          ListEmptyComponent={<Text style={styles.sinMensajes}>Sin mensajes aún</Text>}
        />
      )}

      {/* 🟡 INPUT PARA ENVIAR MENSAJES */}
      {!error && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            value={nuevoMensaje}
            onChangeText={setNuevoMensaje}
            placeholderTextColor="#999"
            editable={!enviando}
          />
          <TouchableOpacity 
            style={[styles.botonEnviar, enviando && styles.botonEnviarDeshabilitado]}
            onPress={enviarMensaje}
            disabled={enviando}
          >
            <Text style={styles.textoBoton}>{enviando ? '...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 20
  },
  nombreChat: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  subtitulo: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 5
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  textoGris: {
    color: '#999',
    marginTop: 10
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15
  },
  botonReintento: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10
  },
  textoBotonReintento: {
    color: '#fff',
    fontWeight: 'bold'
  },
  sinMensajes: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20
  },
  mensajeContainer: {
    marginHorizontal: 15,
    marginVertical: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
    maxWidth: '80%'
  },
  mensajeYo: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end'
  },
  mensajeOtro: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start'
  },
  textoMensaje: {
    fontSize: 16
  },
  textoMensajeYo: {
    color: '#fff'
  },
  textoMensajeOtro: {
    color: '#000'
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: '#000'
  },
  botonEnviar: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center'
  },
  botonEnviarDeshabilitado: {
    opacity: 0.6
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold'
  }
});