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
        <View>
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PermissionRequest')}>
              <Text style={styles.cardText}>Request Permission</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('GatePassVerification')}>
              <Text style={styles.cardText}>GatePass Verification</Text>
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
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '40%',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
});

export default HomePage;
