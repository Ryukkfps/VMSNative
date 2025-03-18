import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env'

const SelectSociety = () => {
  const navigation = useNavigation();
  const [societies, setSocieties] = useState([]);
  const [selectedCity, setSelectedCity] = useState(''); // This should be fetched from AsyncStorage
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingDropdownVisible, setBuildingDropdownVisible] = useState(false);
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatDropdownVisible, setFlatDropdownVisible] = useState(false);

  useEffect(() => {
    const fetchSelectedCity = async () => {
      const storedCity = await AsyncStorage.getItem('selectedCity');
      setSelectedCity(storedCity || '');
    };
    fetchSelectedCity();
  }, []);
  useEffect(() => {
    axios.post(`${API_URL}/societies/city`, { city: selectedCity })
      .then(response => {
        setSocieties(response.data);
      })
      .catch(error => {
        console.error('Error fetching societies:', error);
      });
  }, [selectedCity]);

  const filteredSocieties = societies.filter(society =>
    society.SocietyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSocietySelect = (society) => {
    setSearchQuery(society.SocietyName);
    setDropdownVisible(false);
    axios.post(`${API_URL}/blocks/societyid`,{
        societyid : society._id
    })
      .then(response => {
        setBuildings(response.data);
      })
      .catch(error => {
        console.error('Error fetching buildings:', error);
      });
  };

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building);
    setBuildingDropdownVisible(false);
    axios.post(`${API_URL}/units/blockid`, {
      blockid: building._id
    })
      .then(response => {
        setFlats(response.data);
      })
      .catch(error => {
        console.error('Error fetching flats:', error);
      });
  };

  const handleFlatSelect = (flat) => {
    setSelectedFlat(flat);
    setFlatDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('AddHome')} style={styles.dropdown}>
        <Text style={styles.dropdownText}>{selectedCity}</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Enter Society Name"
        value={searchQuery}
        onFocus={() => setDropdownVisible(true)}
        onChangeText={setSearchQuery}
      />
      {dropdownVisible && (
        <FlatList
          data={filteredSocieties}
          keyExtractor={(item) => item.SocietyName?.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listItem} onPress={() => handleSocietySelect(item)}>
              <Text style={styles.dropdownText}>{item.SocietyName}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      {buildings.length > 0 && (
        <View>
          <TouchableOpacity onPress={() => setBuildingDropdownVisible(!buildingDropdownVisible)} style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedBuilding ? selectedBuilding.BlockName : 'Select Building'}</Text>
          </TouchableOpacity>
          {buildingDropdownVisible && (
            <FlatList
              data={buildings}
              keyExtractor={(item) => item.BlockName?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => handleBuildingSelect(item)}>
                  <Text style={styles.dropdownText}>{item.BlockName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
      {flats.length > 0 && (
        <View>
          <TouchableOpacity onPress={() => setFlatDropdownVisible(!flatDropdownVisible)} style={styles.dropdown}>
            <Text style={styles.dropdownText}>{selectedFlat ? selectedFlat.FlatNumber : 'Select Flat Number'}</Text>
          </TouchableOpacity>
          {flatDropdownVisible && (
            <FlatList
              data={flats}
              keyExtractor={(item) => item.FlatNumber?.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => handleFlatSelect(item)}>
                  <Text style={styles.dropdownText}>{item.FlatNumber}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

export default SelectSociety;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  dropdown: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 16,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
});