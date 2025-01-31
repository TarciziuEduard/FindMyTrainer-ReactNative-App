import React, { useContext, useEffect, useState } from "react";
import { ImageBackground, SafeAreaView, ScrollView, Text, View, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import BackIcon from '../imagini/profile_img/back.png'
import ContIcon from '../imagini/profile_img/Cont.png'
import TrainerIcon from '../imagini/profile_img/Trainer.png'
import OrarIcon from '../imagini/profile_img/Orar_Trainer.png'
import ProgramariIcon from '../imagini/profile_img/Calendar.png'
import NotificariIcon from '../imagini/profile_img/Notificari.png'
import FavoriteIcon from '../imagini/profile_img/favorite.png'
import MesageIcon from '../imagini/profile_img/Mesage.png'
import DeconectareIcon from '../imagini/profile_img/Deconectare.png'
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from "../Authentification/AuthProvider";

const ProfileScreen = ({ navigation }) => {
    const { logout } = useContext(AuthContext);
    const [userName, setUserName] = useState('');

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

    const handleAddTrainerProfile = async () => {
        const user = auth().currentUser;
        if (user) {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.trainer && userData.trainer !== false) {
                    Alert.alert('Ups..', 'Ai deja un profil de antrenor creat.Poți crea doar unul singur!');
                } else {
                    navigation.navigate('AddTrainerInfo');
                }
            }
        }
    };

    const handleManageSchedule = async () => {
        const user = auth().currentUser;
        if (user) {
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.trainer && userData.trainer !== false) {
                    navigation.navigate('ManageScheduleScreen', { trainerId: userData.trainer });
                } else {
                    Alert.alert('Ups..', 'Nu aveți un profil de antrenor pentru a gestiona programul.');
                }
            }
        }
    };

    const handleFeatureNotImplemented = () => {
        Alert.alert('Ups..', 'Această funcționalitate nu este încă disponibilă.');
    };

    return (
        <ScrollView>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                <View style={{ minHeight: 220, backgroundColor: 'black' }}>
                    <TouchableOpacity onPress={() => { navigation.navigate('Home') }} style={{ marginLeft: 20, marginTop: 10 }}>
                        <Image
                            source={BackIcon}
                            style={{ width: 40, height: 40, marginRight: 5 }}
                        />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                        <ImageBackground
                            source={require('../imagini/home_img/profil2.png')}
                            style={{ width: 150, height: 150, marginBottom: 5 }}
                            imageStyle={{ borderRadius: 90 }}
                        />
                        <Text style={{ color: 'white', fontSize: 25, fontFamily: 'Roboto-Medium', marginBottom: 5 }}>{userName}</Text>

                    </View>

                </View>

                <View style={{ marginTop: 10 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('AccountInfoScreen')}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={ContIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Informatii cont</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleAddTrainerProfile}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={TrainerIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Ești antrenor? Publică-ți profilul</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleManageSchedule}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={OrarIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Gestioneaza orarul pentru antrenamente</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('AppointmentsScreen')}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={ProgramariIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Programarile mele</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleFeatureNotImplemented}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={NotificariIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Notificări</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleFeatureNotImplemented}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={FavoriteIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Favorite</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleFeatureNotImplemented}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={MesageIcon}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Mesaje</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => logout()}>
                        <View style={{ marginBottom: 20 }}>
                            <View style={styles.iconContainer}>
                                <Image
                                    source={DeconectareIcon}
                                    style={styles.icon}
                                />
                                <Text style={styles.text}>Deconectare</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                </View>
            </SafeAreaView>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'black',
        backgroundColor: 'white',
        marginHorizontal: 10,
        marginVertical: 5,
    },
    text: {
        flex: 1,
        color: 'black',
        fontSize: 20

    },

    icon: {
        marginRight: 10,
        width: 40,
        height: 40,

    },
})
export default ProfileScreen;
