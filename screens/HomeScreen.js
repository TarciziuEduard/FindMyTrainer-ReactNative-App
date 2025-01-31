import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View, Image, TouchableOpacity, Alert, Dimensions, ActivityIndicator, Modal } from "react-native";
import React, { useEffect, useState } from "react";
import { Picker } from '@react-native-picker/picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import SearchIcon from '../imagini/home_img/search.png';
import LocationIcon from '../imagini/home_img/locatia.png';
import { getCityFromCoordinates } from '../Permission/LocationPermission';
import Geolocation from '@react-native-community/geolocation';
import { saveLocationToCache, getLocationFromCache } from '../Permission/SaveAndGetLocation';
import NetInfo from '@react-native-community/netinfo';

const apiKey = 'AIzaSyBv7LuSFWfINGD4rm4uKX5QnteSnqCEeRw';
const majorCities = ['Locația mea', 'București', 'Cluj-Napoca', 'Sfantu Gheorghee', 'Timișoara', 'Iași', 'Craiova', 'Constanța', 'Galați', 'Brașov', 'Ploiești'];

const HomeScreen = ({ navigation }) => {
  const [selectedCity, setSelectedCity] = useState('Locație');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        Alert.alert(
          'Eroare de rețea',
          'Te rugăm să activezi conexiunea la internet pentru a putea folosi aplicația'
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth().currentUser;
      if (user) {
        if (user.displayName) {
          setUserName(user.displayName);
        } else {
          try {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              setUserName(userData.fullName);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      }
    };

    fetchUserName();

    const user = auth().currentUser;
    if (user) {
      const unsubscribe = firestore().collection('users').doc(user.uid)
        .onSnapshot(doc => {
          if (doc.exists) {
            const userData = doc.data();
            setUserName(userData.fullName);
          }
        });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const fetchCity = async () => {
      const cachedCity = await getLocationFromCache();
      if (cachedCity) {
        setSelectedCity(cachedCity);
      } else {
        getCurrentLocation();
      }
    };

    fetchCity();
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        getCityFromCoordinates(latitude, longitude, apiKey)
          .then(city => {
            setSelectedCity(city);
            saveLocationToCache(city);  
            setIsLoading(false);
          })
          .catch(error => {
            Alert.alert(
              'Eroare la obținerea locației',
              'Te rugăm să activezi locația!'
            );
            setIsLoading(false);
          });
      },
      (error) => {
        if (error.code === 1 || error.code === 2) {
          Alert.alert(
            'Eroare la obținerea locației',
            'Te rugăm să activezi locația.'
          );
        } else {
          Alert.alert(
            'Ups..',
            'A apărut o eroare la obținerea locației.'
          );
        }
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  const handleCityChange = (itemValue) => {
    if (itemValue === 'Locația mea') {
      getCurrentLocation();
    } else {
      setSelectedCity(itemValue);
    }
  };

  const handleDomeniuPress = (domeniu) => {
    navigation.navigate('TrainerListScreen', { selectedCity, domeniu });
  };

  const renderDomeniu = (title, image) => (
    <TouchableOpacity onPress={() => handleDomeniuPress(title)} style={styles.domeniuContainer(windowWidth)}>
      <Image source={image} style={styles.imagine} />
      <Text style={styles.domeniuText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => { navigation.navigate('ProfileScreen') }}>
            <ImageBackground
              source={require('../imagini/home_img/profil2.png')}
              style={styles.profileImage}
              imageStyle={{ borderRadius: 25 }}
            />
          </TouchableOpacity>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => { navigation.navigate('GymListScreen',{selectedCity}) }}
            style={styles.searchInputTouchable}>
            <Image source={SearchIcon} style={styles.searchIcon} />
            <Text style={styles.searchInputText}>Caută sala preferată</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <Image source={LocationIcon} style={styles.locationIcon} />
          <Picker
            style={styles.picker}
            selectedValue={selectedCity}
            onValueChange={(itemValue, itemIndex) => handleCityChange(itemValue)}
          >
            <Picker.Item label={selectedCity} value={selectedCity} />
            {majorCities.map(city => (
              <Picker.Item key={city} label={city} value={city} />
            ))}
          </Picker>
        </View>
        <Text style={styles.chooseText}>Alege un domeniu</Text>
      </View>

      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Preluăm locația...</Text>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View style={styles.domeniuGrid}>
          {renderDomeniu('Fitness', require('../imagini/home_img/fitness.jpg'))}
          {renderDomeniu('Bodybuilding', require('../imagini/home_img/Bodybuilding.jpg'))}
          {renderDomeniu('Aerobic', require('../imagini/home_img/aerobic.jpg'))}
          {renderDomeniu('Yoga', require('../imagini/home_img/yoga.jpg'))}
          {renderDomeniu('Nutriție', require('../imagini/home_img/nutritie.jpg'))}
          {renderDomeniu('CrossFit', require('../imagini/home_img/CrossFit.jpg'))}
          {renderDomeniu('Atletism', require('../imagini/home_img/Atletism.jpg'))}
          {renderDomeniu('Recuperare', require('../imagini/home_img/Recuperare.jpg'))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 10,
    backgroundColor: 'black',
    minHeight: 220,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImage: {
    width: 45,
    height: 45,
    marginRight: 10,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Roboto-Medium',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  searchIcon: {
    width: 30,
    height: 30,
  },
  searchInputTouchable: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    height:'60%',
  },
  searchInputText: {
    color: 'black',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
  },
  separator: {
    width: 1,
    backgroundColor: 'white',
    height: '100%',
  },
  locationIcon: {
    width: 30,
    height: 30,
  },
  picker: {
    fontSize: 14,
    color: 'white',
    width: 170,
  },
  chooseText: {
    fontSize: 22,
    fontFamily: 'Roboto-Medium',
    color: 'white',
    marginVertical: 15,
  },
  scrollView: {
    padding: 10,
    marginTop: 20,
  },
  domeniuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom:50,
  },
  domeniuContainer: (windowWidth) => ({
    width: windowWidth / 2.5,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  }),
  imagine: {
    width: '100%',
    height: 120,
  },
  domeniuText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});

export default HomeScreen;
