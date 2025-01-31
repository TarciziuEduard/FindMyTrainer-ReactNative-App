import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import ImageViewing from 'react-native-image-viewing';
import MapView, { Marker } from 'react-native-maps';
import LinearGradient from 'react-native-linear-gradient';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GOOGLE_MAPS_API_KEY = '#########';

const GymProfileScreen = ({ route, navigation }) => {
  const { gymId } = route.params;
  const [gym, setGym] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchGym = async () => {
      try {
        const gymDoc = await firestore().collection('gyms').doc(gymId).get();
        setGym(gymDoc.data());
      } catch (error) {
        console.error('Error fetching gym:', error);
      }
    };

    fetchGym();
  }, [gymId]);

  useEffect(() => {
    if (gym && gym.name) {
      const fetchTrainers = async () => {
        try {
          const trainersSnapshot = await firestore().collection('trainers').where('location.name', '==', gym.name).get();
          const trainersList = trainersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTrainers(trainersList);
        } catch (error) {
          console.error('Error fetching trainers:', error);
        }
      };

      fetchTrainers();
    }
  }, [gym]);

  const getPhotoUrl = (photoReference) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  const handlePressWebsite = (url) => {
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const handlePressPhone = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error('Error opening phone link:', err));
  };

  const handleLocationPress = () => {
    setIsLocationSelected(!isLocationSelected);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: gym.location.latitude,
        longitude: gym.location.longitude,
        latitudeDelta: isLocationSelected ? 0.02 : 0.08,
        longitudeDelta: isLocationSelected ? 0.02 : 0.08,
      }, 1000);
    }
  };

  if (!gym) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderProfileImage = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        setCurrentImageIndex(index);
        setIsVisible(true);
      }}
    >
      <Image source={{ uri: getPhotoUrl(item) }} style={styles.gymImage} onError={(error) => console.error('Image loading error:', error.nativeEvent.error)} />
    </TouchableOpacity>
  );

  const renderTrainer = ({ item }) => (
    <View style={[styles.trainerCard, { width: Dimensions.get('window').width * 0.9 }]}>
      <Image source={{ uri: item.profileImages[0] }} style={styles.trainerImage} />
      <View style={styles.trainerInfo}>
        <Text style={styles.trainerName}>{item.name}</Text>
        <Text style={styles.trainerDetails}>{item.specialization}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TrainerProfileScreen', { trainerId: item.id })} style={styles.viewProfileButton}>
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  const getRowStyle = (hour) => {
    if (hour.includes('Închis') || hour.includes('No opening hours available')) {
      return styles.hoursRowClosed;
    }
    return styles.hoursRowOpen;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView style={{ flex: 1 }}>
        <View>
          <FlatList
            data={gym.photoReferences}
            renderItem={renderProfileImage}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            decelerationRate="fast"
            onScroll={(event) => {
              const offsetX = event.nativeEvent.contentOffset.x;
              const index = Math.floor(offsetX / screenWidth);
              setCurrentImageIndex(index);
            }}
          />
          <View style={styles.paginationContainer}>
            <LinearGradient
              colors={['#000000', '#535349', '#000000']}
              style={styles.paginationGradient}
            >
              <View style={styles.pagination}>
                {gym.photoReferences && gym.photoReferences.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex
                        ? styles.paginationDotActive
                        : styles.paginationDotInactive,
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>
          <TouchableOpacity onPress={handleLocationPress}>
            <Animated.View style={[styles.locationInfoContainer, isLocationSelected && styles.locationInfoPressed]}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.gymAddress}>{gym.street}</Text>
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: gym.location.latitude,
                longitude: gym.location.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              scrollEnabled={true}
              zoomEnabled={true}
              region={{
                latitude: gym.location.latitude,
                longitude: gym.location.longitude,
                latitudeDelta: isLocationSelected ? 0.008 : 0.08,
                longitudeDelta: isLocationSelected ? 0.008 : 0.08,
              }}
            >
              <Marker
                coordinate={{
                  latitude: gym.location.latitude,
                  longitude: gym.location.longitude,
                }}
                title={gym.name}
                description={gym.street}
              />
            </MapView>
          </View>
        </View>
        <ImageViewing
          images={gym.photoReferences ? gym.photoReferences.map(uri => ({ uri: getPhotoUrl(uri) })) : []}
          imageIndex={currentImageIndex}
          visible={isVisible}
          onRequestClose={() => setIsVisible(false)}
        />
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Contact</Text>
          <View style={styles.card}>
            <Icon name="phone" size={24} color="black" style={styles.cardIcon} />
            <Text style={styles.cardText}>{gym.phone}</Text>
            <TouchableOpacity style={styles.callButton} onPress={() => handlePressPhone(gym.phone)}>
              <Text style={styles.callButtonText}>Apel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Website</Text>
          <TouchableOpacity onPress={() => handlePressWebsite(gym.website)}>
            <View style={styles.card}>
              <Icon name="web" size={24} color="black" style={styles.cardIcon} />
              <Text style={styles.cardText}>{gym.website}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Opening Hours</Text>
          <View style={styles.hoursCard}>
            {gym.hours && gym.hours.map((hour, index) => {
              const [day, time] = hour.split(': ');
              return (
                <View key={index} style={getRowStyle(hour)}>
                  <Text style={styles.dayText}>{day}</Text>
                  <Text style={styles.timeText}>{time}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Antrenori</Text>
          {trainers.length > 0 ? (
            trainers.map((trainer) => (
              <View key={trainer.id} style={styles.trainerCard}>
                <Image source={{ uri: trainer.profileImages[0] }} style={styles.trainerImage} />
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>{trainer.name}</Text>
                  <Text style={styles.trainerDetails}>{trainer.specialization}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('TrainerProfileScreen', { trainerId: trainer.id })} style={styles.viewProfileButton}>
                    <Text style={styles.viewProfileButtonText}>Vezi profil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noTrainersText}>No trainers available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gymImage: {
    width: Dimensions.get('window').width,
    height: 200,
    resizeMode: 'cover',
    backgroundColor: 'gray',
  },
  paginationContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationGradient: {
    width: '100%',
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
  },
  paginationDotInactive: {
    backgroundColor: 'gray',
  },
  locationInfoContainer: {
    margin: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    alignItems: 'center',
    transition: 'all 0.3s ease',
  },
  locationInfoPressed: {
    borderColor: 'blue',
    backgroundColor: 'lightgreen',
    transform: [{ scale: 0.98 }],
  },
  gymName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  gymAddress: {
    fontSize: 18,
    color: 'black',
    textAlign: 'center',
  },
  mapContainer: {
    width: 320,
    height: 320,
    borderRadius: 160, 
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',      
    alignSelf: 'center', 
  },
  map: {
    width: '100%',
    height: '100%',
    alignContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'gray',
  },
  sectionHeaderContainer: {
    padding: 10,
    backgroundColor: 'white',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'black',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  hoursCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 10, 
  },
  cardIcon: {
    marginRight: 10,
  },
  cardText: {
    fontSize: 16,
    color:'black',
    flex: 1,
  },
  callButton: {
    backgroundColor: '#0ed90b',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  callButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hoursRowOpen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    borderColor: 'black',
    backgroundColor: 'lightgreen',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 5,
  },
  hoursRowClosed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    borderColor: 'black',
    backgroundColor: 'lightcoral',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 5,
  },
  dayText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 16,
    color: 'black',
  },
  trainerCard: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 20,
    backgroundColor:'white',
    marginBottom: 20,
    alignSelf: 'center', 
  },
  trainerImage: {
    width: 300,
    height: 300,
    borderRadius:150,
    marginBottom: 10,
  },
  trainerInfo: {
    alignItems: 'center',
  },
  trainerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  trainerDetails: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginVertical: 5,
  },
  viewProfileButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
  },
  viewProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trainersList: {
    padding: 10,
  },
  noTrainersText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default GymProfileScreen;
