import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, FlatList,Switch,Animated,ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import RNPickerSelect from 'react-native-picker-select';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

import AddImage from '../imagini/trainer_img/add_img.png';

const AddTrainerInfoScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [helpWith, setHelpWith] = useState([]);
  const [trainingMethod, setTrainingMethod] = useState([]);
  const [trainingTime, setTrainingTime] = useState([]);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    tiktok: ''
  });
  const [number, setNumber] = useState(null);
  const [prices, setPrices] = useState([{ sessions: '', price: '' }]);
  const [isFirstSessionFree, setIsFirstSessionFree] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));
  const [borderWidth] = useState(new Animated.Value(1));
  const sessionRefs = useRef([]);
  const priceRefs = useRef([]);
  const [location, setLocation] = useState(null);
  const [profileImages, setProfileImages] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [fitnessCenters, setFitnessCenters] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [selectedLocationCity, setSelectedLocationCity] = useState('');
  const [selectedLocationAddress, setSelectedLocationAddress] = useState('');
  const [errors, setErrors] = useState({});
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const GOOGLE_MAPS_API_KEY = 'AIzaSyBv7LuSFWfINGD4rm4uKX5QnteSnqCEeRw';
  const [isLoading, setIsLoading] = useState(false);

  const nameRef = useRef(null);
  const ageRef = useRef(null);
  const experienceRef = useRef(null);
  const descriptionRef = useRef(null);
  const specializationsRef = useRef(null);
  const helpWithRef = useRef(null);
  const trainingMethodRef = useRef(null);
  const trainingTimeRef = useRef(null);
  const socialLinksRef = useRef(null);
  const numberRef = useRef(null);
  const pricesRef = useRef(null);
  const locationRef = useRef(null);
  const profileImagesRef = useRef(null);
  const scrollViewRef = useRef(null);
  

  useEffect(() => {
    const intervalId = setInterval(() => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            });
          }
          clearInterval(intervalId); 
        },
        (error) => {
          console.log(error.code, error.message);
          Alert.alert(
            'Eroare la obținerea locației',
            'Te rugăm să activezi locația pentru a putea folosi această funcționalitate.'
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }, 7000); 
  
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    if (location) {
      fetchFitnessCenters(location);
    }
  }, [location]);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchFitnessCenters = async (location) => {
    const queries = ['gym', 'fitness', 'health club', 'sports club', 'Gym'];
    const allResults = [];

    for (const query of queries) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${location.latitude},${location.longitude}&radius=100000&key=${GOOGLE_MAPS_API_KEY}`;
      try {
        const response = await axios.get(url);
        if (response.data.results) {
          allResults.push(...response.data.results);
        }
      } catch (error) {
        console.error(error);
      }
    }

    const uniqueResults = allResults.reduce((acc, current) => {
      const x = acc.find(item => item.place_id === current.place_id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    setFitnessCenters(uniqueResults);
  };

  const handleImagePicker = () => {
    if (profileImages.length >= 5) {
      alert('Nu poți adăuga mai mult de 5 poze.');
      return;
    }

    launchImageLibrary({ selectionLimit: 0 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else if (response.assets && Array.isArray(response.assets)) {
        const newImages = response.assets.map(asset => asset.uri);
        if (profileImages.length + newImages.length <= 5) {
          setProfileImages((prevImages) => prevImages.concat(newImages));
        } else {
          alert('Nu poți adăuga mai mult de 5 poze.');
        }
      }
    });
  };

  const uploadImages = async (images) => {
    const uploadedImageUrls = [];

    for (const image of images) {
      try {
        const imageName = image.substring(image.lastIndexOf('/') + 1);
        const reference = storage().ref(`trainers/${imageName}`);
        await reference.putFile(image);
        const url = await reference.getDownloadURL();
        uploadedImageUrls.push(url);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }

    return uploadedImageUrls;
  };
  
  const toggleSelection = (item, state, setState) => {
    if (state.includes(item)) {
      setState(state.filter(i => i !== item));
    } else {
      setState([...state, item]);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item }} style={styles.profileImage} />
      <TouchableOpacity onPress={() => handleRemoveImage(item)} style={styles.removeImageButton}>
        <Text style={styles.removeImageButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  const handleRemoveImage = (uri) => {
    setProfileImages((prevImages) => prevImages.filter(image => image !== uri));
  };

  const increaseZoom = () => {
    setZoomLevel((prevZoomLevel) => {
      const newZoomLevel = Math.max(prevZoomLevel / 2, 0.0010);
      updateMapZoom(newZoomLevel);
      return newZoomLevel;
    });
  };

  const decreaseZoom = () => {
    setZoomLevel((prevZoomLevel) => {
      const newZoomLevel = Math.min(prevZoomLevel * 2, 90.0);
      updateMapZoom(newZoomLevel);
      return newZoomLevel;
    });
  };

  const updateMapZoom = (zoomLevel) => {
    if (mapRef.current) {
      const region = mapRef.current.__lastRegion;
      if (region) {
        mapRef.current.animateToRegion({
          ...region,
          latitudeDelta: zoomLevel,
          longitudeDelta: zoomLevel,
        });
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setSearchSuggestions([]);
      restoreFitnessCenters();
      if (mapRef.current && location) {
        mapRef.current.animateToRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
      return;
    }
    if (query.length < 3) {
      setSearchSuggestions([]);
      return;
    }
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&location=${location.latitude},${location.longitude}&radius=5000&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await axios.get(url);
      if (response.data.predictions) {
        setSearchSuggestions(response.data.predictions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectSuggestion = async (suggestion) => {
    setSearchQuery(suggestion.description);
    setSearchSuggestions([]);
  
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await axios.get(url);
      if (response.data.result) {
        const location = response.data.result.geometry.location;
        const region = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
  
        const addressComponents = response.data.result.address_components;
        const cityComponent = addressComponents.find(component =>
          component.types.includes('locality') || component.types.includes('administrative_area_level_3')
        );
        const cityName = cityComponent ? cityComponent.long_name : '';
  
        const updatedCenters = [...fitnessCenters, {
          place_id: suggestion.place_id,
          name: suggestion.description,
          geometry: { location }
        }];
  
        setFitnessCenters(updatedCenters);
        setSelectedMarker(suggestion.place_id);
        setSelectedLocationName(suggestion.description);
        setSelectedLocationCity(cityName);
        setLocation({ latitude: location.lat, longitude: location.lng });
  
        if (mapRef.current) {
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const restoreFitnessCenters = async () => {
    try {
      await fetchFitnessCenters(location);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkerPress = async (placeId) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
    try {
      const response = await axios.get(url);
      if (response.data.result) {
        const location = response.data.result.geometry.location;
        const region = {
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
  
        const addressComponents = response.data.result.address_components;
  
        
        const streetComponent = addressComponents.find(component =>
          component.types.includes('route')
        );
        const streetName = streetComponent ? streetComponent.long_name : '';
  
        const cityComponent = addressComponents.find(component =>
          component.types.includes('locality') || component.types.includes('administrative_area_level_3')
        );
        const cityName = cityComponent ? cityComponent.long_name : '';
  
        
  
        const locationName = response.data.result.name;
        const description = `${locationName}, ${streetName}, ${cityName}`;
  
        setSelectedMarker(placeId);
        setSelectedLocationName(locationName);
        setSelectedLocationCity(cityName);
        setSelectedLocationAddress(streetName)
        setLocation({ latitude: location.lat, longitude: location.lng });
  
        
        setSearchQuery(description);
  
        if (mapRef.current) {
          mapRef.current.animateToRegion(region, 1000);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addPriceField = () => {
    if (prices.length >= 4) {
      alert('Nu poți adăuga mai mult de 4 seturi de prețuri.');
      return;
    }
    setPrices([...prices, { sessions: '', price: '' }]);
  };

  const handlePriceChange = (index, key, value) => {
    const newPrices = prices.map((price, i) => {
      if (i === index) {
        return { ...price, [key]: value };
      }
      return price;
    });
    setPrices(newPrices);
  };
  
  const removePriceField = (index) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const sessionOptions = [
    { label: '1 an', value: '1 an' },
    { label: '1 lună', value: '1 lună' },
    { label: '1 ședință', value: '1 ședință' },
    ...Array.from({ length: 99 }, (_, i=2) => ({ label: `${i + 2} ședințe`, value: `${i + 2} ședințe` })),
  ];
  
  const priceOptions = Array.from({ length: 1000 }, (_, i) => ({ label: `${(i + 1) * 5} Lei`, value: `${(i + 1) * 5}` }));

  const handleToggleSwitch = () => {
    const toValue = isFirstSessionFree ? 1 : 0.97;
    const toBorderWidth = isFirstSessionFree ? 1 : 2;
  
    Animated.timing(animatedValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  
    Animated.timing(borderWidth, {
      toValue: toBorderWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
  
    setIsFirstSessionFree(!isFirstSessionFree);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const firstErrorField = validateFields();
    if (firstErrorField) {
      setIsLoading(false);
      let ref;
      switch (firstErrorField) {
        case 'profileImages':
          ref = profileImagesRef;
          break;
        case 'name':
          ref = nameRef;
          break;
        case 'age':
          ref = ageRef;
          break;
        case 'experience':
          ref = experienceRef;
          break;
        case 'description':
          ref = descriptionRef;
          break;
        case 'specializations':
          ref = specializationsRef;
          break;
        case 'helpWith':
          ref = helpWithRef;
          break;
        case 'trainingMethod':
          ref = trainingMethodRef;
          break;
        case 'trainingTime':
          ref = trainingTimeRef;
          break;
        case 'number':
          ref = numberRef;
          break;
        case 'location':
          ref = locationRef;
          break;
        case 'socialLinks':
          ref = socialLinksRef;
          break;
        case 'prices':
          ref = pricesRef;
          break;
        default:
          ref = null;
      }
  
      if (ref && ref.current) {
        ref.current.measureLayout(scrollViewRef.current, (x, y, width, height) => {
          scrollViewRef.current.scrollTo({ y, animated: true });
        });
      }
      return;
    }
    try {
      const uploadedImageUrls = await uploadImages(profileImages);
      const trainerDocRef = await firestore().collection('trainers').add({
        name,
        age,
        experience,
        description,
        specializations,
        helpWith,
        trainingMethod,
        trainingTime,
        socialLinks,
        number,
        location: { 
          ...location, 
          name: selectedLocationName, 
          city: selectedLocationCity,
          streetName:selectedLocationAddress 
        },
        profileImages: uploadedImageUrls,
        prices,
        isFirstSessionFree
      });

        
      const trainerId = trainerDocRef.id;
      const currentUser = auth().currentUser;

      if (currentUser) {
        await firestore().collection('users').doc(currentUser.uid).update({
          trainer: trainerId
        });
      }
      setIsLoading(false);
      alert('Profilul a fost publicat cu succes!');
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile: ", error);
      alert('Eroare la publicarea profilului.');
    }
  };

  const validateFields = () => {
    const newErrors = {};
    const urlRegex = /^(https:\/\/www\.instagram\.com\/|https:\/\/www\.facebook\.com\/|https:\/\/www\.tiktok\.com\/)/;
    const phoneRegex = /^(?:\+40|0)\d{9}$/;

    if (!name) newErrors.name = 'Acest câmp este obligatoriu';
    if (!age) newErrors.age = 'Selectează o opțiune';
    if (!experience) newErrors.experience = 'Selectează o opțiune';
    if (!description) newErrors.description = 'Acest câmp este obligatoriu';
    if (!specializations.length) newErrors.specializations = 'Selectează cel puțin o opțiune';
    if (!helpWith.length) newErrors.helpWith = 'Selectează cel puțin o opțiune';
    if (!trainingMethod.length) newErrors.trainingMethod = 'Selectează cel puțin o opțiune';
    if (!trainingTime.length) newErrors.trainingTime = 'Selectează cel puțin o opțiune';
    if (!Object.values(socialLinks).some(link => link)) newErrors.socialLinks = 'Completează cel puțin un câmp';
    if (!number || !phoneRegex.test(number)) newErrors.number = 'Număr de telefon invalid. Trebuie să fie un număr românesc valid.';
    if (!prices) newErrors.prices = 'Selectează o opțiune';
    if (!location || !searchQuery) newErrors.location = 'Alege o locație';
    if (!profileImages.length) newErrors.profileImages = 'Adaugă poze';

    if (socialLinks.facebook && !urlRegex.test(socialLinks.facebook)) {
    newErrors.socialLinks = 'Link-ul trebuie să înceapă cu https://www.facebook.com/';
  }
  if (socialLinks.instagram && !urlRegex.test(socialLinks.instagram)) {
    newErrors.socialLinks = 'Link-ul trebuie să înceapă cu https://www.instagram.com/';
  }
  if (socialLinks.tiktok && !urlRegex.test(socialLinks.tiktok)) {
    newErrors.socialLinks = 'Link-ul trebuie să înceapă cu https://www.tiktok.com/';
  }

  prices.forEach((price, index) => {
    if (!price.sessions || !price.price) {
      newErrors.prices = 'Toate câmpurile de prețuri trebuie completate';
    }
  });
  
    setErrors(newErrors);

    if (newErrors.name) return 'name';
    if (newErrors.age) return 'age';
    if (newErrors.experience) return 'experience';
    if (newErrors.description) return 'description';
    if (newErrors.specializations) return 'specializations';
    if (newErrors.helpWith) return 'helpWith';
    if (newErrors.trainingMethod) return 'trainingMethod';
    if (newErrors.trainingTime) return 'trainingTime';
    if (newErrors.number) return 'number';
    if (newErrors.pr) return 'number';
    if (newErrors.location) return 'location';
    if (newErrors.profileImages) return 'profileImages';
    if (newErrors.socialLinks) return 'socialLinks';
    if (newErrors.prices) return 'prices';
  
    
    return null;
  };

  useEffect(() => {
    const resetError = (field) => {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    };
  
    if (name) resetError('name');
    if (age) resetError('age');
    if (experience) resetError('experience');
    if (description) resetError('description');
    if (specializations.length) resetError('specializations');
    if (helpWith.length) resetError('helpWith');
    if (trainingMethod.length) resetError('trainingMethod');
    if (trainingTime.length) resetError('trainingTime');
    if (Object.values(socialLinks).some(link => link)) resetError('socialLinks');
    if (number) resetError('number');
    if (location && searchQuery) resetError('location');
    if (profileImages.length) resetError('profileImages');
    const allPricesFilled = prices.every(price => price.sessions && price.price);
    if (allPricesFilled) resetError('prices');
  }, [name, age, experience,description, specializations, helpWith, trainingMethod,trainingTime, socialLinks, number, location,profileImages,prices]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {isLoading && (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
      </View>
    )}
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Creează profil</Text>
        </View>
        <View style={{ padding: 10 }}>
          <TouchableOpacity onPress={handleImagePicker} ref={profileImagesRef}>
            <View style={styles.addImageButton}>
              <Image source={AddImage} style={styles.icon} />
              <Text style={styles.addImageButtonText}>Adaugă Poze</Text>
            </View>
          </TouchableOpacity>
          {errors.profileImages && <Text style={styles.errorPhoto}>{errors.profileImages}</Text>}

          {profileImages.length > 0 && (
            <FlatList
              data={profileImages}
              renderItem={renderItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageList}
            />
          )}

          <View style={styles.inputContainer} ref={nameRef}>
            <Text style={styles.label}>Nume</Text>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            <TextInput
              placeholder="Nume"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer} ref={ageRef}>
            <Text style={styles.label}>Vârstă</Text>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            <RNPickerSelect
              onValueChange={(value) => setAge(value)}
              items={Array.from({ length: 82 }, (_, i) => ({
                label: `${i + 18}`,
                value: `${i + 18}`
              }))}
              placeholder={{ label: 'Selectează vârsta', value: '' }}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              ref={ageRef}
            />
          </View>

          <View style={styles.inputContainer} ref={experienceRef}>
            <Text style={styles.label}>Experiență</Text>
            {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
            <RNPickerSelect
              onValueChange={(value) => setExperience(value)}
              items={Array.from({ length: 51 }, (_, i) => ({
                label: `${i} ani`,
                value: `${i}`
              }))}
              placeholder={{ label: 'Selectează experiența', value: '' }}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
              ref={experienceRef}
            />
          </View>

          <View style={styles.inputContainer} ref={descriptionRef}>
            <Text style={styles.label}>Descriere</Text>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <TextInput
              placeholder="Descriere"
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline={true}
              numberOfLines={4}
              ref={descriptionRef}
            />
          </View>

          <View style={styles.inputContainer} ref={specializationsRef}>
            <Text style={styles.label}>Specializările mele</Text>
            {errors.specializations && <Text style={styles.errorText}>{errors.specializations}</Text>}
            <View style={styles.checkboxContainer}>
              {['Fitness', 'Pilates', 'Yoga', 'Bodybuilding', 'CrossFit', 'Stretching', 'Aerobic', 'Nutriție', 'Reabilitare', 'Recuperare', 'Atletism', 'Mobilitate'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleSelection(item, specializations, setSpecializations)}
                  style={[
                    styles.selectionButton,
                    specializations.includes(item) && styles.selectionButtonSelected,
                  ]}
                  ref={specializationsRef}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    specializations.includes(item) && styles.selectionButtonTextSelected,
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer} ref={helpWithRef}>
            <Text style={styles.label}>Cu ce te pot ajuta?</Text>
            {errors.helpWith && <Text style={styles.errorText}>{errors.helpWith}</Text>}
            <View style={styles.checkboxContainer}>
              {['Creșterea masei Musculare', 'Scădere în greutate', 'Antrenamente personalizate', 'Nutriție și planificarea meselor', 'Pregătirea pentru competiții sportive', 'Antrenament de grup', 'Creșterea forței fizice', 'Îmbunătățirea performanței atletice', 'Reabilitare după accidentări', 'Antrenament pentru juniori', 'Corectarea Posturii', 'Antrenament în aer liber', 'Antrenament de rezistență', 'Antrenament pentru Mobilitate', 'Antrenament pre și post natal'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleSelection(item, helpWith, setHelpWith)}
                  style={[
                    styles.selectionButton,
                    helpWith.includes(item) && styles.selectionButtonSelected,
                  ]}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    helpWith.includes(item) && styles.selectionButtonTextSelected,
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer} ref={trainingMethodRef}>
            <Text style={styles.label}>Cum antrenez?</Text>
            {errors.trainingMethod && <Text style={styles.errorText}>{errors.trainingMethod}</Text>}
            <View style={styles.checkboxContainer}>
              {['Fizic', 'Online'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleSelection(item, trainingMethod, setTrainingMethod)}
                  style={[
                    styles.selectionButton,
                    trainingMethod.includes(item) && styles.selectionButtonSelected,
                  ]}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    trainingMethod.includes(item) && styles.selectionButtonTextSelected,
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer} ref={trainingTimeRef}>
            <Text style={styles.label}>Când prefer să antrenez?</Text>
            {errors.trainingTime && <Text style={styles.errorText}>{errors.trainingTime}</Text>}
            <View style={styles.checkboxContainer}>
              {['Dimineață', 'Amiază', 'Seară'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleSelection(item, trainingTime, setTrainingTime)}
                  style={[
                    styles.selectionButton,
                    trainingTime.includes(item) && styles.selectionButtonSelected,
                  ]}
                >
                  <Text style={[
                    styles.selectionButtonText,
                    trainingTime.includes(item) && styles.selectionButtonTextSelected,
                  ]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer} ref={socialLinksRef}>
            <Text style={styles.label}>Link-uri sociale</Text>
            {errors.socialLinks && <Text style={styles.errorText}>{errors.socialLinks}</Text>}
            <TextInput
              placeholder="Facebook"
              value={socialLinks.facebook}
              onChangeText={(text) => setSocialLinks({ ...socialLinks, facebook: text })}
              style={styles.links}
            />
            <TextInput
              placeholder="Instagram"
              value={socialLinks.instagram}
              onChangeText={(text) => setSocialLinks({ ...socialLinks, instagram: text })}
              style={styles.links}
            />
            <TextInput
              placeholder="TikTok"
              value={socialLinks.tiktok}
              onChangeText={(text) => setSocialLinks({ ...socialLinks, tiktok: text })}
              style={styles.links}
            />
          </View>

          <View style={styles.inputContainer} ref={numberRef}>
            <Text style={styles.label}>Număr de telefon</Text>
            {errors.number && <Text style={styles.errorText}>{errors.number}</Text>}
            <TextInput
              placeholder="Număr de telefon"
              value={number}
              onChangeText={setNumber}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer} ref={pricesRef}>
            <Text style={styles.label}>Prețuri pe ședințe</Text>

            <Animated.View style={[
            styles.switchContainer,
            {
              backgroundColor: isFirstSessionFree ? 'rgba(0, 255, 0, 0.2)' : 'white',
              transform: [{ scale: animatedValue }],
              borderWidth: borderWidth,
            }
          ]}>
            <Text style={styles.switchText}>Ofer prima ședință gratuită?</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#767577" }}
              thumbColor={isFirstSessionFree ? "green" : "yellow"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleSwitch}
              value={isFirstSessionFree}
              style={styles.switch}
            />
          </Animated.View>
          {errors.prices && <Text style={styles.errorText}>{errors.prices}</Text>}
          {prices.map((price, index) => (
            <View key={index} style={styles.priceContainer}>
              <View style={styles.sessionPickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) => handlePriceChange(index, 'sessions', value)}
                  items={sessionOptions}
                  placeholder={{ label: 'Număr ședințe', value: '' }}
                  useNativeAndroidPickerStyle={false}
                  style={pickerSelectStyles}
                  ref={(el) => (sessionRefs.current[index] = el)}
                />
              </View>
              <MaterialCommunityIcons name="arrow-right" size={24} color="black" style={styles.arrowIcon} />
              <View style={styles.pricePickerContainer}>
                <RNPickerSelect
                  onValueChange={(value) => handlePriceChange(index, 'price', value)}
                  items={priceOptions}
                  placeholder={{ label: 'Preț (lei)', value: '' }}
                  useNativeAndroidPickerStyle={false}
                  style={pickerSelectStyles}
                  ref={(el) => (priceRefs.current[index] = el)}
                />
              </View>
              {index === 0 ? (
                <TouchableOpacity onPress={addPriceField} style={styles.addButton}>
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => removePriceField(index)} style={styles.addButton}>
                  <Text style={styles.addButtonText}>-</Text>
                </TouchableOpacity>
              )}
            </View>
            
            ))}
            </View>

          <View style={styles.inputContainer} ref={locationRef}>
            <Text style={styles.label}>Locația unde antrenez</Text>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            <View style={styles.mapContainer}>
              <TextInput
                placeholder="Caută locații"
                value={searchQuery}
                onChangeText={handleSearch}
                style={styles.searchInput}
              />
              {searchSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {searchSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => selectSuggestion(suggestion)}
                      style={styles.suggestion}
                    >
                      <Text style={styles.suggestionText}>{suggestion.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ position: 'relative', height: 300 }}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: location ? location.latitude : 45.9432,
                    longitude: location ? location.longitude : 24.9668,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }}
                  onRegionChangeComplete={(region) => {
                    setZoomLevel(region.latitudeDelta);
                  }}
                >
                  {fitnessCenters.map((center, index) => (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: center.geometry.location.lat,
                        longitude: center.geometry.location.lng,
                      }}
                      title={center.name}
                      description={center.vicinity}
                      onPress={() => handleMarkerPress(center.place_id)}
                    />
                  ))}
                </MapView>
                <View style={styles.zoomButtons}>
                  <TouchableOpacity onPress={increaseZoom} style={styles.zoomButton}>
                    <Text style={styles.zoomButtonText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={decreaseZoom} style={styles.zoomButton}>
                    <Text style={styles.zoomButtonText}>-</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Publică</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
  };
const styles = StyleSheet.create({
  headerContainer: {
    padding: 10,
    minHeight: 150,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black', 
    borderBottomWidth: 2,
    borderBottomColor: 'black', 
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'white', 
    color: 'black', 
  },
  textArea: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'white', 
    color: 'black', 
    textAlignVertical: 'top', 
    minHeight: 100, 
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    margin: 5,
    backgroundColor: 'white',
  },
  selectionButtonSelected: {
    backgroundColor: 'yellow',
  },
  selectionButtonText: {
    color: 'black',
  },
  selectionButtonTextSelected: {
    color: 'black',
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginRight: 10,
    marginTop: 20,
  },
  links: {
    borderWidth: 2,
    borderColor: 'black',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'white', 
    color: 'black',
    marginBottom:10, 
  },
  profileImagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  imageList: {
    marginBottom: 20,
  },
  addImageButton: {
    backgroundColor: 'yellow',
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 20,
    width: '45%',
    alignSelf: 'center',
  },
  addImageButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 1,
    backgroundColor: 'black',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: 'yellow',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
    width: 40,
    height: 40,
  },
  mapContainer: {
    position: 'relative',
  },
  map: {
    height: 400,
    width: '100%',
    borderRadius: 20,
    marginBottom: 20,
  },
  zoomButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
  },
  zoomButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    padding: 10,
    backgroundColor: 'white',
    color: 'black',
    marginBottom: 10,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    borderColor: 'black',
    borderWidth: 1,
    marginTop: -10,
    zIndex: 1,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  suggestionText: {
    color: 'black',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  sessionPickerContainer: {
    flex: 1.5, 
    marginRight: 2,
  },
  pricePickerContainer: {
    flex: 1, 
    marginLeft: 2,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: 'yellow',
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    borderColor: 'black',
  },
  switchText: {
    fontSize: 16,
    color: 'black',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom:10,
  },
  errorPhoto: {
    color: 'red',
    fontSize: 14,
    marginTop: -15,
    alignSelf: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 20,
    color: 'black',
    backgroundColor: 'white', 
    paddingRight: 30, 
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 20,
    color: 'black',
    backgroundColor: 'white', 
    paddingRight: 30, 
  },

  
};

export default AddTrainerInfoScreen;
