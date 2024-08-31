import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, firestore } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Login from './components/Login';

const App = () => {
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [address, setAddress] = useState('Loading...');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftStarted, setShiftStarted] = useState(false);
  const [shiftId, setShiftId] = useState(null);  // To track the shift document
  const [loadingStartShift, setLoadingStartShift] = useState(false); // State for start shift loading
  const [loadingEndShift, setLoadingEndShift] = useState(false); // State for end shift loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(location);

        let addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (addressResponse[0]) {
          const { name, street, city, region } = addressResponse[0];
          const formattedAddress = `${name ? name + ', ' : ''}${street ? street + ', ' : ''}${city}, ${region}`;
          setAddress(formattedAddress);
        } else {
          setAddress('Unable to retrieve address');
        }
      })();

      const intervalId = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [user]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartShift = async () => {
    if (shiftStarted) {
      Alert.alert('Shift already started');
      return;
    }

    setLoadingStartShift(true);

    try {
      const docRef = await addDoc(collection(firestore, 'attendance'), {
        userId: user.uid,
        startTime: serverTimestamp(),
        location: address || 'Location not available',
      });
      setShiftStarted(true);
      setShiftId(docRef.id);  // Save the shift document ID
      Alert.alert('Shift started successfully');
    } catch (error) {
      console.error('Error starting shift:', error);
      Alert.alert('Error starting shift');
    } finally {
      setLoadingStartShift(false);
    }
  };

  const handleEndShift = async () => {
    if (!shiftStarted) {
      Alert.alert('Shift has not started yet');
      return;
    }

    setLoadingEndShift(true);

    try {
      await updateDoc(doc(firestore, 'attendance', shiftId), {
        endTime: serverTimestamp(),
      });
      setShiftStarted(false);
      Alert.alert('Shift ended successfully');
    } catch (error) {
      console.error('Error ending shift:', error);
      Alert.alert('Error ending shift');
    } finally {
      setLoadingEndShift(false);
    }
  };

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check in</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => auth.signOut()}>
          <Text style={styles.closeButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        {location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
              description={address}
            />
          </MapView>
        )}
      </View>
      
      <View style={styles.footer}>
        {!shiftStarted ? (
          loadingStartShift ? (
            <ActivityIndicator size="large" color="#2094F3" />
          ) : (
            <TouchableOpacity 
              style={styles.startShiftButton} 
              onPress={handleStartShift}
            >
              <Text style={styles.startShiftButtonText}>Start Shift</Text>
            </TouchableOpacity>
          )
        ) : (
          loadingEndShift ? (
            <ActivityIndicator size="large" color="#FF4D4D" />
          ) : (
            <TouchableOpacity 
              style={styles.endShiftButton} 
              onPress={handleEndShift}
            >
              <Text style={styles.endShiftButtonText}>End Shift</Text>
            </TouchableOpacity>
          )
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Current time</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{formatTime(currentTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your location is</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoValue}>{address}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111518',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  mapButton: {
    backgroundColor: '#1B2227',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
  },
  mapButtonText: {
    color: 'white',
    fontSize: 24,
  },
  footer: {
    padding: 20,
  },
  startShiftButton: {
    backgroundColor: '#2094F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  startShiftButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endShiftButton: {
    backgroundColor: '#FF4D4D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  endShiftButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    
  },
  checkInText: {
    color: '#9CACBA',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    color: 'white',
    fontSize: 16,
  },
  infoValue: {
    color: '#9CACBA',
    fontSize: 14,
  },
});

export default App;
