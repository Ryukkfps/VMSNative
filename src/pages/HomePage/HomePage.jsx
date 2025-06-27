import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Navbar from '../../components/Navbar/Navbar';
import {getToken, getUserRole} from '../../utils/dbStore';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserFeed from '../BlogPosting/UserFeed';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faUserShield, faCheckCircle} from '@fortawesome/free-solid-svg-icons';

const HomePage = () => {
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userToken = await getToken();
        const role = await getUserRole();
        const HomeId = await AsyncStorage.getItem('selectedHomeId');
        console.log(HomeId);
        setToken(userToken);
        setUserRole(role);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Navbar />
      {userRole !== 'Guard' ? (
        <UserFeed />
      ) : (
        <View style={styles.guardContainer}>
          <Text style={styles.welcomeText}>Guard Dashboard</Text>
          <Text style={styles.subtitleText}>Select an action to continue</Text>

          <View style={styles.cardsWrapper}>
            <TouchableOpacity
              style={[styles.card, styles.permissionCard]}
              onPress={() => navigation.navigate('PermissionRequest')}
              activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <FontAwesomeIcon icon={faUserShield} size={32} color="#007AFF" />
              </View>
              <Text style={styles.cardTitle}>Request Permission</Text>
              <Text style={styles.cardDescription}>Submit visitor permission requests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.verificationCard]}
              onPress={() => navigation.navigate('GatePassVerification')}
              activeOpacity={0.8}>
              <View style={styles.iconContainer}>
                <FontAwesomeIcon icon={faCheckCircle} size={32} color="#28a745" />
              </View>
              <Text style={styles.cardTitle}>GatePass Verification</Text>
              <Text style={styles.cardDescription}>Verify visitor entry permits</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  guardContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  cardsWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '85%',
    maxWidth: 300,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  permissionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  verificationCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Legacy styles for backward compatibility
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
});

export default HomePage;
