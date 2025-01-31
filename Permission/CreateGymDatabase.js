import firestore from '@react-native-firebase/firestore';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/ro';
import 'moment-timezone';

moment.locale('ro'); 

const GOOGLE_MAPS_API_KEY = '######';

const cityLocations = [
  { latitude: 44.4268, longitude: 26.1025, name: 'Bucuresti' },
  { latitude: 47.1585, longitude: 27.6014, name: 'Iasi' },
  { latitude: 46.7712, longitude: 23.6236, name: 'Cluj-Napoca' },
  { latitude: 45.7489, longitude: 21.2087, name: 'Timisoara' },
  { latitude: 44.1598, longitude: 28.6348, name: 'Constanta' },
  { latitude: 47.0722, longitude: 21.9212, name: 'Oradea' },
  { latitude: 45.6579, longitude: 25.6012, name: 'Brasov' },
  { latitude: 45.9432, longitude: 24.9668, name: 'Sibiu' },
  { latitude: 44.3302, longitude: 23.7949, name: 'Craiova' },
  { latitude: 45.4353, longitude: 28.0077, name: 'Galati' },
  { latitude: 44.94, longitude: 26.0325, name: 'Ploiesti' },
  { latitude: 45.2692, longitude: 27.9575, name: 'Braila' },
  { latitude: 46.1866, longitude: 21.3123, name: 'Arad' },
  { latitude: 44.8565, longitude: 24.8692, name: 'Pitesti' },
  { latitude: 46.567, longitude: 26.9154, name: 'Bacau' },
  { latitude: 46.5425, longitude: 24.5575, name: 'Targu Mures' },
  { latitude: 47.6536, longitude: 23.5795, name: 'Baia Mare' },
  { latitude: 45.1047, longitude: 24.3754, name: 'Ramnicu Valcea' },
  { latitude: 45.1509, longitude: 26.8235, name: 'Buzau' },
  { latitude: 47.7926, longitude: 22.8859, name: 'Satu Mare' },
  { latitude: 47.6371, longitude: 26.2593, name: 'Suceava' },
  { latitude: 46.927, longitude: 26.3709, name: 'Piatra Neamt' },
  { latitude: 44.9255, longitude: 25.4566, name: 'Targoviste' },
  { latitude: 45.6961, longitude: 27.1834, name: 'Focsani' },
  { latitude: 46.0773, longitude: 23.5748, name: 'Alba Iulia' },
  { latitude: 46.6407, longitude: 27.7276, name: 'Vaslui' },
  { latitude: 46.2333, longitude: 27.6667, name: 'Barlad' },
  { latitude: 46.9241, longitude: 26.9313, name: 'Roman' },
];

const queries = [
  'gym ', 
  'Gym ',
  'gym',
  'fitness ',    
  'workout',  
  'crossfit', 
  'bodybuilding', 
  'Fit',
  'Fitness',
  'Fight',
];

const getCityFromAddress = (address) => {
  if (!address) {
    return 'Unknown city';
  }

  const parts = address.split(',');
  const cityPart = parts[parts.length - 2]?.trim();
  const cityWithoutPostalCode = cityPart ? cityPart.replace(/\d+/g, '').trim() : 'Unknown city';
  return cityWithoutPostalCode;
};

const fetchGyms = async (location, query) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${location.latitude},${location.longitude}&radius=50000&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.results || [];
  } catch (error) {
    console.error(`Error fetching gyms for ${location.name}:`, error);
    return [];
  }
};

const fetchGymDetails = async (placeId) => {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await axios.get(url);
    return response.data.result || {};
  } catch (error) {
    console.error(`Error fetching gym details for place_id ${placeId}:`, error);
    return {};
  }
};

const daysOfWeekInRomanian = {
  "Monday": "Luni",
  "Tuesday": "Marți",
  "Wednesday": "Miercuri",
  "Thursday": "Joi",
  "Friday": "Vineri",
  "Saturday": "Sâmbătă",
  "Sunday": "Duminică"
};

const formatOpeningHours = (openingHours) => {
  if (!openingHours || !openingHours.weekday_text) {
    return ['No opening hours available'];
  }

  return openingHours.weekday_text.map(day => {
    
    const [englishDay, hours] = day.split(': ');
    const romanianDay = daysOfWeekInRomanian[englishDay] || englishDay;
    
    let formattedHours;
    if (hours === "Open 24 hours") {
      formattedHours = "Deschis 24 de ore";
    } else if (hours === "Closed") {
      formattedHours = "Închis";
    } else {
      formattedHours = hours.replace(/(\d{1,2}:\d{2})\s?(AM|PM)/gi, (match, p1, p2) => {
        return moment(p1 + p2, ["h:mm A"]).format("HH:mm");
      });
    }

    return `${romanianDay}: ${formattedHours}`;
  });
};

export const fetchGymsAndSaveToFirebase = async () => {

  const gymsCollection = await firestore().collection('gyms').get();

  if (!gymsCollection.empty) {
    console.log('Gyms collection already exists in Firestore.');
    return;
  }
  
  const allResults = [];

  for (const location of cityLocations) {
    for (const query of queries) {
      const gyms = await fetchGyms(location, query);
      allResults.push(...gyms);
    }
  }

  
  const uniqueGyms = allResults.reduce((acc, current) => {
    const hasPhoto = current.photos && current.photos.length > 0;
    const isUnique = !acc.some(item => item.place_id === current.place_id);
    if (hasPhoto && isUnique) {
      acc.push(current);
    }
    return acc;
  }, []);

  for (const gym of uniqueGyms) {
    const gymDetails = await fetchGymDetails(gym.place_id);
    const {
      name,
      formatted_address,
      geometry,
      photos,
      opening_hours,
      formatted_phone_number,
      website,
    } = gymDetails;

    const city = getCityFromAddress(formatted_address);
    const street = formatted_address ? formatted_address.replace(`, ${city}`, '').trim() : 'No street available';

    const photoReferences = photos ? photos.slice(0, 3).map(photo => photo.photo_reference) : [];
    const hours = formatOpeningHours(opening_hours);

    try {
      await firestore().collection('gyms').add({
        name: name || 'No name available',
        street: street,
        city: city,
        location: geometry && geometry.location ? new firestore.GeoPoint(geometry.location.lat, geometry.location.lng) : new firestore.GeoPoint(0, 0),
        photoReferences: photoReferences,
        hours: hours,
        phone: formatted_phone_number || 'No phone number available',
        website: website || 'No website available',
      });
    } catch (error) {
      console.error('Error saving gym to Firebase:', error);
    }
  }

  console.log('Gyms data fetched and saved to Firebase');
};
