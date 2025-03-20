import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const AddHome = () => {
  const navigation = useNavigation();
  const [cities, setCities] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log(`${API_URL}/societies/cities`)
    axios.get(`${API_URL}/societies/cities`)
      .then(response => {
        setCities(response.data);
      })
      .catch(error => {
        console.error('Error fetching cities:', error);
      });
  }, []);

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = async (city) => {
    try {
      await AsyncStorage.setItem('selectedCity', city);
      navigation.navigate('SelectSociety'); // Replace 'NextPage' with the actual page you want to navigate to
    } catch (error) {
      console.error('Error saving city:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {searchActive ? (
          <TouchableOpacity onPress={() => { setSearchActive(false); setSearchQuery(''); }} style={styles.backButton}>
            <FontAwesomeIcon icon={faTimes} size={20} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
          </TouchableOpacity>
        )}
        {searchActive ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search city"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={() => setSearchActive(true)} style={styles.searchButton}>
            <FontAwesomeIcon icon={faSearch} size={20} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Select City</Text>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.gridContainer}>
          {filteredCities.slice(0, 6).map((city, index) => (
            <TouchableOpacity key={index} style={styles.cityButton} onPress={() => handleCitySelect(city)}>
              <Text style={styles.cityText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.listContainer}>
          {filteredCities.slice(6).map((city, index) => (
            <TouchableOpacity key={index} onPress={() => handleCitySelect(city)}>
              <Text style={styles.listText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    marginRight: 16,
    padding: 5,
  },
  searchButton: {
    marginRight: 16,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cityButton: {
    width: '30%',
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
  },
  cityText: {
    fontSize: 16,
  },
  listContainer: {
    marginTop: 20,
  },
  listText: {
    fontSize: 16,
    paddingVertical: 8,
  },
});

export default AddHome;