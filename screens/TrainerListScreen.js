import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const TrainersListScreen = ({ route, navigation }) => {
  const { selectedCity, domeniu } = route.params;
  const [allTrainers, setAllTrainers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [currentImageIndices, setCurrentImageIndices] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchTrainers = async () => {
      let trainersList = [];
      try {
        if (selectedCity!='Locație') {
          const trainersSnapshot = await firestore()
            .collection('trainers')
            .where('location.city', '==', selectedCity)
            .where('specializations', 'array-contains', domeniu)
            .get();
          trainersList = trainersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
          const trainersSnapshot = await firestore()
            .collection('trainers')
            .where('specializations', 'array-contains', domeniu)
            .get();
          trainersList = trainersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      }
      setAllTrainers(trainersList);
      setTrainers(trainersList);
    };
  
    fetchTrainers();
  }, [selectedCity, domeniu]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const lowercasedQuery = query.toLowerCase();
      const filteredTrainers = allTrainers.filter(trainer => trainer.name.toLowerCase().includes(lowercasedQuery));
      setSuggestions(filteredTrainers);
    } else {
      setSuggestions([]);
      setTrainers(allTrainers);
    }
  };

  const handleSuggestionPress = (trainer) => {
    setSearchQuery(trainer.name);
    setTrainers([trainer]);
    setSuggestions([]);
  };

  const handleScroll = (trainerId, event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.floor(offsetX / width);
    setCurrentImageIndices(prevIndices => ({
      ...prevIndices,
      [trainerId]: index,
    }));
  };

  const renderTrainer = ({ item }) => {
    const currentImageIndex = currentImageIndices[item.id] || 0;

    return (
      <View style={styles.trainerCard}>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detailsLine}>
            <Text style={styles.detail}>{item.location?.city}</Text>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.detail}>{item.age} ani</Text>
            <Text style={styles.detailSeparator}>•</Text>
            <Text style={styles.detail}>{item.experience} ani experiență</Text>
          </Text>
          <View style={styles.separator} />
          <Text style={styles.detail}>{item.location?.name}</Text>
        </View>
        <FlatList
          data={item.profileImages}
          renderItem={({ item: image }) => (
            <TouchableOpacity onPress={() => navigation.navigate('TrainerProfileScreen', { trainerId: item.id })}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.trainerImage} />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(image, index) => index.toString()}
          horizontal
          pagingEnabled={item.profileImages.length > 1}
          scrollEnabled={item.profileImages.length > 1}
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => handleScroll(item.id, event)}
          snapToInterval={width}
          decelerationRate="fast"
        />
        <View style={styles.paginationContainer}>
          <LinearGradient
            colors={['#000000', '#535349', '#000000']}
            style={styles.paginationGradient}
          >
            <View style={styles.pagination}>
              {item.profileImages && item.profileImages.map((_, index) => (
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
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="black" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută antrenorul preferat"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity key={suggestion.id} onPress={() => handleSuggestionPress(suggestion)}>
              <Text style={styles.suggestionText}>{suggestion.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {trainers.length === 0 && (
          <Text style={styles.noTrainersText}>Nu s-au găsit antrenori din acest domeniu în apropierea ta.</Text>
        )}
      <FlatList
        data={trainers}
        renderItem={renderTrainer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.trainersList}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'black',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontWeight:'bold',
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 3,
    marginBottom: 10,
  },
  suggestionText: {
    padding: 10,
    color:'black',
    fontWeight:'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    fontSize: 16,
  },
  trainerCard: {
    marginBottom: 40,
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 10,
    shadowColor: '#000',
  },
  infoContainer: {
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 10,
    marginBottom: 10,
  },
  imageContainer: {
    width,
    height: width,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  trainerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  detailsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  detail: {
    fontSize: 14,
    color: 'white',
  },
  detailSeparator: {
    fontSize: 14,
    color: 'white',
    marginHorizontal: 5,
  },
  separator: {
    height: 1,
    backgroundColor: 'white',
    marginVertical: 5,
  },
  paginationContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationGradient: {
    width: '100%',
    paddingVertical: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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

  noTrainersText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
    marginVertical: 20,
  },
  
});

export default TrainersListScreen;
