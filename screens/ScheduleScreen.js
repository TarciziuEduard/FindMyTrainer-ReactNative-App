import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ScheduleScreen = ({ navigation, route }) => {
  const { trainerId } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);

  const fetchAvailableTimes = async (date) => {
    try {
      const scheduleDoc = await firestore().collection('schedules').doc(trainerId).get();
      if (scheduleDoc.exists && scheduleDoc.data().days[date]) {
        setAvailableTimes(scheduleDoc.data().days[date].availableTimes || []);
      } else {
        setAvailableTimes([]);
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      Alert.alert('Eroare', 'A apărut o eroare la obținerea intervalelor disponibile.');
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAvailableTimes(today);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedDate) {
        fetchAvailableTimes(selectedDate);
      }
    }, [selectedDate])
  );

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    fetchAvailableTimes(day.dateString);
  };

  const handleSchedulePress = (time) => {
    navigation.navigate('ConfirmAppointmentScreen', { trainerId, date: selectedDate, time });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            [selectedDate]: { selected: true, marked: true, selectedColor: 'black' },
          }}
          minDate={new Date().toISOString().split('T')[0]}
          theme={{
            selectedDayBackgroundColor: 'black',
            todayTextColor: '#6200ee',
            arrowColor: 'black',
          }}
        />

        {availableTimes.length > 0 ? (
          <View style={styles.timeSlotsContainer}>
            <Text style={styles.availableTimesHeader}>Intervale disponibile pentru {selectedDate}</Text>
            {availableTimes.map((time, index) => (
              <TouchableOpacity key={index} onPress={() => handleSchedulePress(time)} style={styles.timeSlot}>
                <Text style={styles.timeSlotText}>{time}</Text>
                <Icon name="chevron-right" size={24} color="black" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.noTimesText}>Nu sunt intervale disponibile pentru {selectedDate}.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    padding: 10,
    marginTop: 20,
  },
  availableTimesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginVertical: 10,
  },
  timeSlotsContainer: {
    padding: 15,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom:20,
    flexDirection: 'column',
    paddingHorizontal: 10,
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 1,
    marginVertical: 5,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  noTimesText: {
    fontSize: 16,
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default ScheduleScreen;
