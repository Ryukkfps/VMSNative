import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React from 'react'
import Navbar from '../../components/Navbar/Navbar'
import { getToken } from '../../utils/dbStore'
import { useNavigation } from '@react-navigation/native'


const HomePage = () => {
  const token = getToken();
  const navigation = useNavigation();

  return (
    <View>
        <Navbar/>
      <View style={styles.cardContainer}>
        {/* <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddHome')}>
          <Text style={styles.cardText}>Add Home</Text>
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PreApproved')}>
          <Text style={styles.cardText}>Pre-Approve Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
  }
});

export default HomePage
