import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Image } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ConfirmAppointmentScreen = ({ route, navigation }) => {
  const { trainerId, date, time } = route.params;
  const [trainer, setTrainer] = useState(null);
  const [userName, setUserName] = useState('');
  const [interval, setInterval] = useState(60);

  useEffect(() => {
    const fetchTrainer = async () => {
      const trainerDoc = await firestore().collection('trainers').doc(trainerId).get();
      setTrainer(trainerDoc.data());
    };

    const fetchUserName = async () => {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          setUserName(userDoc.data().fullName || '');
        }
      }
    };

    const fetchInterval = async () => {
      const scheduleDoc = await firestore().collection('schedules').doc(trainerId).get();
      if (scheduleDoc.exists) {
        setInterval(scheduleDoc.data().interval || 60);
      }
    };

    fetchTrainer();
    fetchUserName();
    fetchInterval();
  }, [trainerId]);

  const calculateEndTime = (startTime, interval) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date(1970, 0, 1, hours, minutes + interval);
    const endHours = endTime.getHours().toString().padStart(2, '0');
    const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
    return `${startTime}-${endHours}:${endMinutes}`;
  };

  const handleConfirm = async () => {
    const batch = firestore().batch();

    try {
      
      const appointmentRef = firestore().collection('appointments').doc();
      batch.set(appointmentRef, {
        trainerId,
        trainerName: trainer.name,
        userId: auth().currentUser.uid,
        userName,
        date,
        time,
        timeInterval: calculateEndTime(time, interval), 
        locationName: trainer.location?.name,
        locationCity: trainer.location?.city,
      });

      
      const scheduleRef = firestore().collection('schedules').doc(trainerId);
      const scheduleDoc = await scheduleRef.get();

      if (scheduleDoc.exists) {
        const days = scheduleDoc.data().days;
        if (days && days[date] && days[date].availableTimes) {
          const updatedTimes = days[date].availableTimes.filter(t => t !== time);
          batch.update(scheduleRef, {
            [`days.${date}.availableTimes`]: updatedTimes,
          });
        }
      }

      
      await batch.commit();

      Alert.alert('Succes', 'Te-ai programat cu succes.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ScheduleScreen', { trainerId }),
        },
      ]);
    } catch (error) {
      console.error('Error confirming schedule:', error);
      Alert.alert('Eroare', 'A apărut o eroare la confirmarea programării.');
    }
  };

  if (!trainer) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Încărcare...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: trainer.profileImages[0] }} style={styles.profileImage} />
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="calendar-today" size={20} color="black" />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Icon name="schedule" size={20} color="black" />
            <Text style={styles.detailText}>{calculateEndTime(time, interval)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Icon name="person" size={20} color="black" />
            <Text style={styles.detailText}>Antrenor: {trainer.name}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Icon name="fitness-center" size={20} color="black" />
            <Text style={styles.detailText}>Antrenament</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Icon name="location-on" size={20} color="black" />
            <Text style={styles.detailText}>{trainer.location?.name}, {trainer.location?.city}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirmă programarea</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    borderColor: 'black',
    borderWidth: 2,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  confirmButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 5,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConfirmAppointmentScreen;
