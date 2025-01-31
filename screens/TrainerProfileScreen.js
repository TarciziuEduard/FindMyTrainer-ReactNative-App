import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import ImageViewing from 'react-native-image-viewing';
import MapView, { Marker } from 'react-native-maps';
import LinearGradient from 'react-native-linear-gradient';
import { Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TikTokIcon from '../imagini/trainer_img/tiktok.png';
const GOOGLE_MAPS_API_KEY = 'AIzaSyBv7LuSFWfINGD4rm4uKX5QnteSnqCEeRw';

const TrainerProfileScreen = ({ route, navigation }) => {
  const { trainerId } = route.params;
  const [trainer, setTrainer] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState('Despre');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const aboutSectionRef = useRef(null);
  const pricesSectionRef = useRef(null);
  const scheduleSectionRef = useRef(null);
  const highlightPosition = useRef(new Animated.Value(0)).current;
  const highlightWidth = useRef(new Animated.Value(0)).current;
  const [sectionMeasurements, setSectionMeasurements] = useState({});
  const [navBarTop, setNavBarTop] = useState(0);
  const [isNavBarFixed, setIsNavBarFixed] = useState(false);
  const navBarRef = useRef(null);
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [gymImageUri, setGymImageUri] = useState(null);


  useEffect(() => {
    const fetchTrainerAndGymImage = async () => {
      try {
        const trainerDoc = await firestore().collection('trainers').doc(trainerId).get();
        const trainerData = trainerDoc.data();
        setTrainer(trainerData);
  
        if (trainerData && trainerData.location && trainerData.location.name) {
          const gymSnapshot = await firestore().collection('gyms').where('name', '==', trainerData.location.name).get();
          if (!gymSnapshot.empty) {
            const gymData = gymSnapshot.docs[0].data();
            const firstImage = gymData.photoReferences ? getPhotoUrl(gymData.photoReferences[0]) : null;
            setGymImageUri(firstImage);
          }
        }
      } catch (error) {
        console.error('Error fetching trainer or gym data:', error);
      }
    };
  
    fetchTrainerAndGymImage();
  }, [trainerId]);

  const getPhotoUrl = (photoReference) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  };
  
  const openLink = (url) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          console.log("Don't know how to open URI: " + url);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };
  

  const renderSocialLinks = () => {
    const { socialLinks } = trainer;
    if (!socialLinks) return null;
  
    const links = [
      { name: 'facebook', icon: 'facebook', url: socialLinks.facebook },
      { name: 'instagram', icon: 'instagram', url: socialLinks.instagram },
      { name: 'tiktok', icon: TikTokIcon, url: socialLinks.tiktok, isImage: true },
    ];
  
    return links
      .filter(link => link.url)
      .map(link => (
        <View key={link.name} style={styles.socialLinkContainer}>
          {link.isImage ? (
            <Image source={link.icon} style={styles.tiktokIcon} />
          ) : link.name === 'instagram' ? (
            <LinearGradient
              colors={['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5']}
              style={styles.iconInstagramContainer}
            >
              <Icon name={link.icon} size={24} color="white" />
            </LinearGradient>
          ) : (
            <Icon name={link.icon} size={24} color="blue" />
          )}
          <View style={{ width: 10 }} />
          <Text style={styles.socialLinkText}>{link.name.charAt(0).toUpperCase() + link.name.slice(1)}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.socialLinkButton} onPress={() => openLink(link.url)}>
            <Text style={styles.linkText}>Vezi profil</Text>
          </TouchableOpacity>
        </View>
      ));
  };

  useEffect(() => {
    if (navBarRef.current) {
      navBarRef.current.measure((x, y, width, height, pageX, pageY) => {
        setNavBarTop(pageY);
      });
    }
  }, [trainer]);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY >= navBarTop) {
      setIsNavBarFixed(true);
    } else {
      setIsNavBarFixed(false);
    }
  };

  if (!trainer) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <Text>Încărcare...</Text>
      </SafeAreaView>
    );
  }

  const renderProfileImage = ({ item, index }) => (
    <View style={styles.imageWrapper}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.closeButton}
      >
        <Icon name="close" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setCurrentImageIndex(index);
          setIsVisible(true);
        }}
      >
        <Image source={{ uri: item }} style={styles.profileImage} onError={(error) => console.error('Image loading error:', error.nativeEvent.error)} />
      </TouchableOpacity>
    </View>
  );

  const screenWidth = Dimensions.get('window').width;

  const scrollToSection = (sectionRef) => {
    sectionRef.current.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current.scrollTo({ x: 0, y, animated: true });
      }
    );
  };

  const handleSectionPress = (section, ref, x, width) => {
    setSelectedSection(section);
    scrollToSection(ref);
    Animated.parallel([
      Animated.timing(highlightPosition, {
        toValue: x,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(highlightWidth, {
        toValue: width,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();
  };

  const getSpecializationIcon = (specialization) => {
    const icons = {
      Fitness: 'dumbbell',
      Pilates: 'yoga',
      Yoga: 'meditation',
      Bodybuilding: 'weight-lifter',
      CrossFit: 'run',
      Stretching: 'human',
      Aerobic: 'heart-pulse',
      Nutriție: 'food-apple',
      Reabilitare: 'hospital',
      Recuperare: 'medical-bag',
      Atletism: 'run-fast',
      Mobilitate: 'human-male-board',
    };
    return icons[specialization] || 'alert-circle';
  };
  
  const getTrainingMethodIcon = (method) => {
    const icons = {
      Fizic: 'account-group',
      Online: 'laptop',
    };
    return icons[method] || 'alert-circle';
  };
  
  const getTrainingTimeIcon = (time) => {
    const icons = {
      Dimineață: 'brightness-5',
      Amiază: 'brightness-7',
      Seară: 'brightness-4',
    };
    return icons[time] || 'alert-circle';
  };

  const renderCard = (iconName, text) => (
    <View style={styles.card}>
      <Icon name={iconName} size={24} color="black" style={styles.cardIcon} />
      <Text style={styles.cardText}>{text}</Text>
    </View>
  );

  const handleLocationPress = () => {
    setIsLocationSelected(!isLocationSelected);
  };



  const renderLocation = () => {
    if (!trainer.location) return null;
  
    const handleGymProfilePress = async () => {
      try {
        const gymSnapshot = await firestore().collection('gyms').where('name', '==', trainer.location.name).get();
        if (!gymSnapshot.empty) {
          const gymId = gymSnapshot.docs[0].id;
          navigation.navigate('GymProfileScreen', { gymId });
        }
      } catch (error) {
        console.error('Error navigating to gym profile:', error);
      }
    };
  
    return (
      <View style={styles.locationContainer}>
        <TouchableOpacity
          onPress={handleLocationPress}
          activeOpacity={1}
          style={[
            styles.locationInfo,
            isLocationSelected && styles.locationInfoPressed,
          ]}
        >
          {gymImageUri && (
            <Image source={{ uri: gymImageUri }} style={styles.locationImage} />
          )}
          <View>
            <TouchableOpacity onPress={handleGymProfilePress}>
              <Text style={styles.locationName}>{trainer.location.name}</Text>
            </TouchableOpacity>
            <Text style={styles.locationAddress}>
              {trainer.location.streetName}, {trainer.location.city}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: trainer.location.latitude,
              longitude: trainer.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            region={
              isLocationSelected
                ? {
                    latitude: trainer.location.latitude,
                    longitude: trainer.location.longitude,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  }
                : {
                    latitude: trainer.location.latitude,
                    longitude: trainer.location.longitude,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.15,
                  }
            }
          >
            <Marker
              coordinate={{
                latitude: trainer.location.latitude,
                longitude: trainer.location.longitude,
              }}
              title={trainer.location.name}
              description={`${trainer.location.streetName}, ${trainer.location.city}`}
              style={isLocationSelected ? { transform: [{ scale: 1.5 }] } : { transform: [{ scale: 1 }] }}
            />
          </MapView>
        </View>
      </View>
    );
  };
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View>
          <FlatList
            data={trainer.profileImages}
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
              colors={['#000000', '#535349','#000000']} 
              style={styles.paginationGradient}
            >
              <View style={styles.pagination}>
                {trainer.profileImages && trainer.profileImages.map((_, index) => (
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
        </View>
        <ImageViewing
          images={trainer.profileImages ? trainer.profileImages.map(uri => ({ uri })) : []}
          imageIndex={currentImageIndex}
          visible={isVisible}
          onRequestClose={() => setIsVisible(false)}
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{trainer.name}</Text>
          <Text style={styles.detailsLine}>
            <Text style={styles.detail}>{trainer.location?.city}</Text>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.detail}>{trainer.age} ani</Text>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.detail}>{trainer.experience} ani experiență</Text>
          </Text>
          </View>

        <View ref={navBarRef} style={[styles.navContainer, styles.navBarContainer]}>
          <Animated.View style={[styles.navHighlight, { left: highlightPosition, width: highlightWidth }]} />
          {['Despre', 'Prețuri  ', 'Programează-te'].map(section => (
            <TouchableOpacity
              key={section}
              onPress={() => {
                const { x, width } = sectionMeasurements[section];
                handleSectionPress(section, section === 'Despre' ? aboutSectionRef : section === 'Prețuri  ' ? pricesSectionRef : scheduleSectionRef, x, width);
              }}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                setSectionMeasurements(prev => ({ ...prev, [section]: { x, width } }));
                if (section === selectedSection) {
                  highlightPosition.setValue(x);
                  highlightWidth.setValue(width);
                }
              }}
              style={styles.navItemContainer}
            >
              <Text style={[styles.navItem, selectedSection === section && styles.navItemSelected]}>{section}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionContainer} ref={aboutSectionRef}>
          <Text style={styles.sectionHeader}>Despre</Text>
          <View style={styles.descriptionCard}>
            <Icon name="book-open-variant" size={28} color="black" style={styles.descriptionIcon} />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.descriptionText, !isExpanded && styles.collapsedText]}
                numberOfLines={isExpanded ? undefined : 5}
              >
                {trainer.description}
              </Text>
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.expandText}>
                  {isExpanded ? 'Vezi mai puțin' : 'Vezi mai mult'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Specializările mele</Text>
          {trainer.specializations && trainer.specializations.map((specialization, index) => (
            <View key={index} style={styles.cardContainer}>
              {renderCard(getSpecializationIcon(specialization), specialization)}
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Cu ce te pot ajuta?</Text>
          {trainer.helpWith && trainer.helpWith.map((help, index) => (
            <View key={index} style={styles.cardContainer}>
              {renderCard("check-decagram", help)}
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Cum antrenez?</Text>
          {trainer.trainingMethod && trainer.trainingMethod.map((method, index) => (
            <View key={index} style={styles.cardContainer}>
              {renderCard(getTrainingMethodIcon(method), method)}
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Când prefer să antrenez?</Text>
          {trainer.trainingTime && trainer.trainingTime.map((time, index) => (
            <View key={index} style={styles.cardContainer}>
              {renderCard(getTrainingTimeIcon(time), time)}
            </View>
          ))}
        </View>

        <View style={styles.sectionContainer} ref={pricesSectionRef}>
          <Text style={styles.sectionHeader}>Prețuri</Text>
          <View style={styles.pricesContainer}>
            <View style={[
              styles.firstSessionContainer,
              trainer.isFirstSessionFree ? styles.firstSessionFree : styles.firstSessionNotFree
            ]}>
              <Text style={styles.firstSessionText}>
                {trainer.isFirstSessionFree ? 'Prima ședință este gratuită!' : 'Prima ședință nu este gratuită!'}
              </Text>
            </View>
              {trainer.prices && trainer.prices.map((price, index) => (
              <View key={index} style={styles.priceRow}>
                <View style={styles.sessionContainer}>
                  <Text style={styles.sessionText}>{price.sessions}</Text>
                </View>
                <Icon name="arrow-right" size={24} color="black" style={styles.arrowIcon} />
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{price.price} lei</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer} >
          <Text style={styles.sectionHeader}>Link-uri sociale</Text>
          {renderSocialLinks()}
          </View>

          <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Contact</Text>
            <View style={styles.phoneContainer}>
              <Icon name="phone-dial" size={24} color="#0ed90b" style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{trainer.number}</Text>
              <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${trainer.number}`)}>
                <Text style={styles.callButtonText}>Apel</Text>
              </TouchableOpacity>
            </View>
          </View>
        
          <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>Locații unde antrenez</Text>
          {renderLocation()}
        </View>

        
        <View style={{ padding: 10, marginBottom: 30 }} ref={scheduleSectionRef}>
        <TouchableOpacity
          onPress={() => {
            console.log("TrainerId:", trainerId);
            navigation.navigate('ScheduleScreen', { trainerId });
          }}
          style={styles.ProgrameazaButton}
        >
          <Text style={styles.ProgrameazaButtonText}>Programează-te online</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>



      {isNavBarFixed && (
        <Animated.View style={[styles.navContainer, styles.navContainerFixed]}>
          <Animated.View style={[styles.navHighlight, { left: highlightPosition, width: highlightWidth }]} />
          {['Despre', 'Prețuri  ', 'Programează-te'].map(section => (
            <TouchableOpacity
              key={section}
              onPress={() => {
                const { x, width } = sectionMeasurements[section];
                handleSectionPress(section, section === 'Despre' ? aboutSectionRef : section === 'Prețuri  ' ? pricesSectionRef : scheduleSectionRef, x, width);
              }}
              style={styles.navItemContainer}
            >
              <Text style={[styles.navItem, selectedSection === section && styles.navItemSelected]}>{section}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: Dimensions.get('window').width,
    height: 450,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: 'gray',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    width: '100%',
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
  paginationGradient: {
    width: '100%',
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    margin: 20,
    padding:10,
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    backgroundColor:'lightgray',
    borderBottomWidth: 5,
    borderBottomColor: 'lightgray',
    marginBottom:30,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color:'black',
  },
  detailsLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  detail: {
    fontSize: 16,
    color:'black',
    fontWeight:'bold',
  },
  detailSeparator: {
    fontSize: 16,
    marginHorizontal: 8,
    fontWeight:'bold',
    color:'black',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingVertical: 1,
    borderBottomWidth: 5,
    borderBottomColor: 'lightgray',
    position: 'relative', 
  },
  navBarContainer: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 50,
    margin: 5,
  },
  navContainerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'black', 
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 50,
  },
  navItemContainer: {
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  navItem: {
    fontSize: 16,
    color: 'white',
  },
  navItemSelected: {
    color: 'yellow',
    fontWeight: 'bold',
  },
  navHighlight: {
    position: 'absolute',
    bottom: -5, 
    height: 5,
    backgroundColor: 'yellow',
    borderRadius: 3,
  },
  sectionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'gray',
  },
  sectionHeader: {
    fontSize: 18,
    color:'black',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'column',
    alignItems: 'center',
  },
  descriptionIcon: {
    marginRight: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  collapsedText: {
    overflow: 'hidden',
  },
  expandText: {
    color: 'blue',
    fontWeight:'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    marginRight: 10,
  },
  cardText: {
    fontSize: 16,
    color:'black',
    
  },
  locationContainer: {
    borderTopWidth: 1,
    borderTopColor: 'gray',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop:10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  locationInfoPressed: {
    borderColor: 'blue',
    backgroundColor: 'lightgreen',
    transform: [{ scale: 0.98 }],
  },
  locationImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    textDecorationLine: 'underline',
  },
  locationAddress: {
    fontSize: 16,
    color: 'black',
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
    alignContent:'center',
    alignItems:'center',

  },
  socialLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignContent:'space-between',
    marginBottom:10,
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    borderRadius: 20,
  },
  socialLinkText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  linkText: {
    fontSize: 16,
    color: 'black',
    textDecorationLine:'underline',
    fontWeight:'bold',
  },
  tiktokIcon: {
    width: 32,
    height: 32,
  },
  iconInstagramContainer: {
    width: 25,
    height: 25,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firstSessionFreeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
  },
  firstSessionContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  firstSessionFree: {
    backgroundColor: 'lightgreen',
  },
  firstSessionNotFree: {
    backgroundColor: 'lightcoral',
  },
  firstSessionText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pricesContainer: {
    borderWidth: 2,
    borderColor: 'black',
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionContainer: {
    backgroundColor: 'yellow',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priceContainer: {
    backgroundColor: '#3ef7ba',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  arrowIcon: {
    marginHorizontal: 10,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'black',
    marginTop: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  phoneIcon: {
    marginRight: 10,
  },
  phoneText: {
    fontSize: 16,
    flex: 1,
    color:'black',
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
  ProgrameazaButton: {
    backgroundColor: 'yellow',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  ProgrameazaButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TrainerProfileScreen;
