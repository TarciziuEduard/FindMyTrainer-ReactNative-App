import React, { useRef, useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';

const OnboardingScreen = ({ navigation }) => {
  const onboardingRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (onboardingRef.current) {
        if (currentPage === 2) {
          setCurrentPage(0);
          onboardingRef.current.goToPage(0);
        } else {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          onboardingRef.current.goToPage(nextPage);
        }
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentPage]);

  return (
    <Onboarding
      ref={onboardingRef}
      onDone={() => navigation.navigate('FirstScreen')}
      onSkip={() => navigation.navigate('FirstScreen')}
      pages={[
        {
          backgroundColor: 'black',
          image: (
            <Image
              source={require('../imagini/trainer2.png')}
              style={styles.image}
            />
          ),
          title: 'Bine ai venit in aplicație!',
          subtitle: 'Caută-ți sala și antrenorul preferat',
        },
        {
          backgroundColor: 'black',
          image: (
            <Image
              source={require('../imagini/gym.png')}
              style={styles.image}
            />
          ),
          title: 'Descoperă noi săli de fitness',
          subtitle: 'Explorează cele mai bune săli din orașul tău',
        },
        {
          backgroundColor: 'black',
          image: (
            <Image
              source={require('../imagini/stayFit2.png')}
              style={styles.image}
            />
          ),
          title: 'Stai in forma cu ajutorul antrenorilor',
          subtitle: 'Programaează o sedință alături de antrenorul tău preferat',
        },
      ]}
      titleStyles={styles.title}
      subTitleStyles={styles.subtitle}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'AvenirNext-Bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'AvenirNext-Regular',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default OnboardingScreen;
