import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from 'react-native-maps';
import axios from 'axios';


const GEOAPIFY_API_KEY = 'YOU_API_KEY_HERE';
const CATEGORIES = 'accommodation.hotel,catering.restaurant';


export default function App() {
  const [region, setRegion] = useState(null);
  const [pois, setPois] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Enable location permissions in settings');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = loc.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.04, longitudeDelta: 0.05 });
      await fetchPOIs(latitude, longitude);
    })();
  }, []);

  // Fetch POIs and tag each with its category
  const fetchPOIs = async (lat, lon) => {
    try {
      const cats = CATEGORIES.split(',');
      let allFeatures = [];
      for (const cat of cats) {
        const url =
          `https://api.geoapify.com/v2/places?categories=${cat}&filter=circle:${lon},${lat},10000&limit=20&apiKey=${GEOAPIFY_API_KEY}`;
        const res = await axios.get(url);
        const tagged = res.data.features.map(f => ({ ...f, categoryKey: cat }));
        allFeatures = allFeatures.concat(tagged);
      }
      console.log('Total POIs fetched:', allFeatures.length);
      setPois(allFeatures);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch POIs');
    }
  };

  if (!region) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" style={styles.loading} />
      </SafeAreaView>
    );
  }
  const icons = {  
    'accommodation.hotel': require('./assets/hotel.png'),
    'catering.restaurant': require('./assets/restaurant.png'),
    default: require('./assets/default.png'),
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What's Nearby?</Text>
        <Text style={styles.subtitle}>Displaying hotels and restaurants near you.</Text>
      </View>

      <MapView style={styles.map} initialRegion={region}>
        {pois.map(poi => {
          const [lon, lat] = poi.geometry.coordinates;
          const catKey = poi.categoryKey || 'default';

          const iconSource = icons[catKey] || icons.default;

          return (

            <Marker key={poi.properties.place_id} coordinate={{ latitude: lat, longitude: lon }}>
              <Image source={iconSource} style={styles.markerIcon} />
              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{poi.properties.name}</Text>
                  {poi.properties.address_line2 ? (
                    <Text style={styles.calloutDescription}>{poi.properties.address_line2}</Text>
                  ) : null}
                </View>
              </Callout>
            </Marker>
          );
        })}


      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  markerIcon: {
    width: 30,
    height: 30,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: -10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 12,
  },
});
