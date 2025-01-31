import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import 'moment/locale/ro';

const AppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [isTrainer, setIsTrainer] = useState(false);

  useEffect(() => {
    moment.locale('ro'); 

    const fetchAppointments = async () => {
      const user = auth().currentUser;
      if (!user) return;

      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setIsTrainer(userData.trainer && userData.trainer !== false);

        const appointmentsRef = firestore().collection('appointments');
        let appointmentsQuery;

        if (userData.trainer && userData.trainer !== false) {
          const trainerId = userData.trainer;
          const trainerAppointmentsQuery = appointmentsRef.where('trainerId', '==', trainerId);
          const trainerAppointmentsSnapshot = await trainerAppointmentsQuery.get();
          const trainerAppointments = await Promise.all(trainerAppointmentsSnapshot.docs.map(async doc => {
            const appointment = doc.data();
            const clientDoc = await firestore().collection('users').doc(appointment.userId).get();
            appointment.userName = clientDoc.exists ? clientDoc.data().fullName : 'Unknown User';
            return appointment;
          }));

          setAppointments(trainerAppointments);
        } else {
          appointmentsQuery = appointmentsRef.where('userId', '==', user.uid);
          const userAppointmentsSnapshot = await appointmentsQuery.get();
          const userAppointments = await Promise.all(userAppointmentsSnapshot.docs.map(async doc => {
            const appointment = doc.data();
            const trainerDoc = await firestore().collection('trainers').doc(appointment.trainerId).get();
            appointment.trainerName = trainerDoc.exists ? trainerDoc.data().name : 'Unknown Trainer';
            appointment.locationName = trainerDoc.exists ? trainerDoc.data().location.name : 'Unknown Location';
            appointment.locationCity = trainerDoc.exists ? trainerDoc.data().location.city : 'Unknown City';
            return appointment;
          }));

          setAppointments(userAppointments);
        }
      }
    };

    fetchAppointments();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {appointments.length > 0 ? (
          appointments.map((appointment, index) => (
            <View key={index} style={styles.appointmentCard}>
              <View style={styles.detailRow}>
                <Icon name="event" size={20} color="black" />
                <Text style={styles.detailDateText}>
                  {moment(appointment.date).format('dddd, D MMMM')}
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.detailRow}>
                <Icon name="schedule" size={20} color="black" />
                <Text style={styles.detailText}>{appointment.timeInterval}</Text>
              </View>
              <View style={styles.separator} />
              {isTrainer ? (
                <View style={styles.detailRow}>
                  <Icon name="person" size={20} color="black" />
                  <Text style={styles.detailText}>Client: {appointment.userName}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.detailRow}>
                    <Icon name="fitness-center" size={20} color="black" />
                    <Text style={styles.detailText}>Antrenor: {appointment.trainerName}</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.detailRow}>
                    <Icon name="location-on" size={20} color="black" />
                    <Text style={styles.detailText}>{appointment.locationName}, {appointment.locationCity}</Text>
                  </View>
                </>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noAppointmentsText}>Nu aveți programări.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  appointmentCard: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  detailDateText: {
    fontSize: 16,
    fontWeight:'bold',
    marginLeft: 10,
    color: 'blue',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  noAppointmentsText: {
    fontSize: 18,
    color: 'red',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default AppointmentsScreen;
