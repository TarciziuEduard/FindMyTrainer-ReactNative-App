import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

const GOOGLE_MAPS_API_KEY = '############';

const GymListScreen = ({route, navigation }) => {
  const [allGyms, setAllGyms] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedCity } = route.params;

  useEffect(() => {
    const fetchGyms = async () => {
     try {
        if (selectedCity!='Locație') {
        const gymsSnapshot = await firestore().collection('gyms')
        .where('city', '==', selectedCity)
        .get();
        const gymsList = gymsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllGyms(gymsList);
        setGyms(gymsList);
        setIsLoading(false);
        }

        else {
          const gymsSnapshot = await firestore().collection('gyms')
        .get();
        const gymsList = gymsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllGyms(gymsList);
        setGyms(gymsList);
        setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching gyms:', error);
        setIsLoading(false);
      }
    };

    fetchGyms();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const lowercasedQuery = query.toLowerCase();
      const filteredGyms = allGyms.filter(gym => gym.name.toLowerCase().includes(lowercasedQuery));
      setSuggestions(filteredGyms);
    } else {
      setSuggestions([]);
      setGyms(allGyms);
    }
  };

  const handleSuggestionPress = (gym) => {
    setSearchQuery(gym.name);
    setGyms([gym]);
    setSuggestions([]);
  };

  const getPhotoUrl = (photoReference) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
  };

  const renderGym = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('GymProfileScreen', { gymId: item.id })}>
      <View style={styles.gymCard}>
        <Text style={styles.gymName}>{item.name}</Text>
        <Text style={styles.gymAddress}>{item.street}</Text>
        {item.photoReferences && item.photoReferences.length > 0 && (
          <Image
            source={{ uri: getPhotoUrl(item.photoReferences[0]) }}
            style={styles.gymImage}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="black" />
          <Text style={styles.loadingText}>Încărcăm sălile...</Text>
        </View>
      </Modal>
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="black" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută sala preferată"
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
      <FlatList
        data={gyms}
        renderItem={renderGym}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gymsList}
      />
    </View>
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
    fontWeight: 'bold',
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
    color: 'black',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'black',
    fontSize: 16,
  },
  gymsList: {
    paddingBottom: 20,
  },
  gymCard: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'black',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gymName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'white',
  },
  gymAddress: {
    fontSize: 14,
    color: 'white',
    marginBottom: 10,
  },
  gymImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
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

export default GymListScreen;
