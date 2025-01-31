import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import firestore from '@react-native-firebase/firestore';

const ManageScheduleScreen = ({ route, navigation }) => {
  const { trainerId } = route.params;
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [startHour, setStartHour] = useState('07:00');
  const [endHour, setEndHour] = useState('22:00');
  const [breakStart, setBreakStart] = useState('');
  const [breakEnd, setBreakEnd] = useState('');
  const [interval, setInterval] = useState('60'); 

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date) => {
    try {
      const scheduleDoc = await firestore().collection('schedules').doc(trainerId).get();
      if (scheduleDoc.exists && scheduleDoc.data().days[date]) {
        setTimeSlots(scheduleDoc.data().days[date].availableTimes || []);
      } else {
        setTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      Alert.alert('Eroare', 'A apărut o eroare la obținerea intervalelor orare.');
    }
  };

  const handleGenerateTimeSlots = () => {
    const slots = generateTimeSlots(startHour, endHour, breakStart, breakEnd, parseInt(interval));
    setTimeSlots(slots);
    saveTimeSlots(slots);
  };

  const generateTimeSlots = (start, end, breakStart, breakEnd, interval) => {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const breakStartTime = breakStart ? new Date(`1970-01-01T${breakStart}:00`) : null;
    const breakEndTime = breakEnd ? new Date(`1970-01-01T${breakEnd}:00`) : null;
    let slots = [];

    while (startTime < endTime) {
      if (breakStartTime && breakEndTime && startTime >= breakStartTime && startTime < breakEndTime) {
        startTime.setMinutes(breakEndTime.getMinutes());
        continue;
      }
      slots.push(startTime.toTimeString().substr(0, 5));
      startTime.setMinutes(startTime.getMinutes() + interval);
    }

    return slots;
  };

  const handleRemoveTimeSlot = (timeSlot) => {
    const updatedTimeSlots = timeSlots.filter((slot) => slot !== timeSlot);
    setTimeSlots(updatedTimeSlots);
    saveTimeSlots(updatedTimeSlots);
  };

  const saveTimeSlots = async (updatedTimeSlots) => {
    try {
      const scheduleRef = firestore().collection('schedules').doc(trainerId);
      const scheduleDoc = await scheduleRef.get();

      if (scheduleDoc.exists) {
        await scheduleRef.update({
          [`days.${selectedDate}.availableTimes`]: updatedTimeSlots,
          interval: interval
        });
      } else {
        await scheduleRef.set({
          days: {
            [selectedDate]: { availableTimes: updatedTimeSlots }
          },
          interval: interval
        });
      }

      Alert.alert('Succes', 'Intervalele orare au fost actualizate.');
    } catch (error) {
      console.error('Error saving time slots:', error);
      Alert.alert('Eroare', 'A apărut o eroare la salvarea intervalelor orare.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <FlatList
          ListHeaderComponent={
            <>
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={(day) => setSelectedDate(day.dateString)}
                  markedDates={{
                    [selectedDate]: { selected: true, marked: true, selectedColor: 'black' },
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                    selectedDayBackgroundColor: '#6200ee',
                    todayTextColor: '#6200ee',
                    arrowColor: 'black',
                  }}
                />
                {selectedDate && (
                  <View style={styles.configContainer}>
                    <Text style={styles.dateHeader}>Configurare intervale:</Text>
                    <View style={styles.newTimeSlotContainer}>
                      <Text style={styles.label}>Ora de început</Text>
                      <TextInput
                        value={startHour}
                        onChangeText={setStartHour}
                        placeholder="07:00"
                        style={styles.timeInput}
                      />
                      <Text style={styles.label}>Ora de sfârșit</Text>
                      <TextInput
                        value={endHour}
                        onChangeText={setEndHour}
                        placeholder="22:00"
                        style={styles.timeInput}
                      />
                      <Text style={styles.label}>Ora de început pauză</Text>
                      <TextInput
                        value={breakStart}
                        onChangeText={setBreakStart}
                        placeholder="12:00"
                        style={styles.timeInput}
                      />
                      <Text style={styles.label}>Ora de sfârșit pauză</Text>
                      <TextInput
                        value={breakEnd}
                        onChangeText={setBreakEnd}
                        placeholder="13:00"
                        style={styles.timeInput}
                      />
                      <Text style={styles.label}>Interval (minute)</Text>
                      <TextInput
                        value={interval}
                        onChangeText={setInterval}
                        placeholder="60"
                        style={styles.timeInput}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity onPress={handleGenerateTimeSlots} style={styles.addButton}>
                        <Text style={styles.addButtonText}>Generează Intervale</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </>
          }
          data={timeSlots}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.timeSlotContainer}>
              <Text style={styles.timeSlotText}>{item}</Text>
              <TouchableOpacity onPress={() => handleRemoveTimeSlot(item)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Șterge</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarContainer: {
    padding: 10,
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 10,
  },
  configContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dateHeader: {
    fontSize: 18,
    color:'black',
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  newTimeSlotContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color:'black',
    marginBottom: 5,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  addButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 10,
    width: '100%',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#ffffff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#ff5252',
    padding: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ManageScheduleScreen;
