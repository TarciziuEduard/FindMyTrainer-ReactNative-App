import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const navigateToLoginRegister = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../imagini/logo.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <TouchableOpacity style={styles.button} onPress={navigateToLoginRegister}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonStart}>Find now</Text>
          <Image
            source={require('../imagini/arrow.png')}
            style={styles.arrow}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'yellow',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'yellow',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStart: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'fantasy',
    textAlign: 'center',
  },
  arrow: {
    width: 30,
    height: 30,
    marginLeft: 10,
  },
});

export default HomeScreen;
