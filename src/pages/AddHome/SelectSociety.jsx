import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../../utils/dbStore'
import {API_URL} from '@env'
import { jwtDecode } from "jwt-decode";
import Toast from 'react-native-toast-message';
import Navbar from '../../components/Navbar/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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
  const [buildingSearchQuery, setBuildingSearchQuery] = useState('');
  const [flatSearchQuery, setFlatSearchQuery] = useState('');
  const [ownershipTypes, setOwnershipTypes] = useState([]);
  const [selectedOwnershipType, setSelectedOwnershipType] = useState(null);
  const [ownershipDropdownVisible, setOwnershipDropdownVisible] = useState(false);
  const [ownershipSearchQuery, setOwnershipSearchQuery] = useState('');
  const [occupancyStatuses, setOccupancyStatuses] = useState([]);
  const [selectedOccupancyStatus, setSelectedOccupancyStatus] = useState(null);
  const [occupancyDropdownVisible, setOccupancyDropdownVisible] = useState(false);
  const [occupancySearchQuery, setOccupancySearchQuery] = useState('');
  const [selectedSociety, setSelectedSociety] = useState(null);

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

  const filteredBuildings = buildings.filter(building =>
    building.BlockName.toLowerCase().includes(buildingSearchQuery.toLowerCase())
  );

  const filteredFlats = flats.filter(flat =>
    flat.FlatNumber.toLowerCase().includes(flatSearchQuery.toLowerCase())
  );

  const handleSocietySelect = (society) => {
    setSelectedSociety(society);
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
    // Fetch ownership types when flat is selected
    axios.get(`${API_URL}/ownership-types`)
      .then(response => {
        setOwnershipTypes(response.data);
      })
      .catch(error => {
        console.error('Error fetching ownership types:', error);
      });
  };

  const filteredOwnershipTypes = ownershipTypes.filter(type =>
    type.TypeName.toLowerCase().includes(ownershipSearchQuery.toLowerCase())
  );

  const handleOwnershipSelect = (ownershipType) => {
    setSelectedOwnershipType(ownershipType);
    setOwnershipDropdownVisible(false);
    // Fetch occupancy statuses when ownership type is selected
    axios.get(`${API_URL}/occupancy-statuses/ownershiptype/${ownershipType._id}`)
      .then(response => {
        console.log(response.data)
        setOccupancyStatuses(response.data);
      })
      .catch(error => {
        console.error('Error fetching occupancy statuses:', error);
      });
  };

  const filteredOccupancyStatuses = occupancyStatuses.filter(status =>
    status.OSName.toLowerCase().includes(occupancySearchQuery.toLowerCase())
  );

  const handleOccupancySelect = (occupancyStatus) => {
    setSelectedOccupancyStatus(occupancyStatus);
    setOccupancyDropdownVisible(false);
  };

  const handleAddHome = async () => {
    if (!selectedSociety || !selectedBuilding || !selectedFlat || !selectedOwnershipType || !selectedOccupancyStatus) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Selection',
        text2: 'Please select all required fields.',
      });
      return;
    }

    try {
      const token = await getToken();
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      const homeData = {
        UserId: userId,
        SId: selectedSociety._id,
        BId: selectedBuilding._id,
        UId: selectedFlat._id,
        OwnershipType: selectedOwnershipType._id,
        OccupancyStatus: selectedOccupancyStatus._id,
      };

      axios.post(`${API_URL}/homes`, homeData)
        .then(response => {
          Toast.show({
            type: 'success',
            text1: 'Home Added',
            text2: 'Your home has been added successfully.',
          });
          navigation.navigate('Home');
        })
        .catch(error => {
          Toast.show({
            type: 'error',
            text1: 'Error Adding Home',
            text2: error.response?.data || 'An error occurred while adding home',
          });
        });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error decoding token or fetching user ID.',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.navigate('AddHome')} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Home</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
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
            <TextInput
              style={styles.input}
              placeholder="Enter Building Name"
              value={selectedBuilding ? selectedBuilding.BlockName : buildingSearchQuery}
              onFocus={() => setBuildingDropdownVisible(true)}
              onChangeText={setBuildingSearchQuery}
            />
            {buildingDropdownVisible && (
              <FlatList
                data={filteredBuildings}
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
            <TextInput
              style={styles.input}
              placeholder="Enter Flat Number"
              value={selectedFlat ? selectedFlat.FlatNumber : flatSearchQuery}
              onFocus={() => setFlatDropdownVisible(true)}
              onChangeText={setFlatSearchQuery}
            />
            {flatDropdownVisible && (
              <FlatList
                data={filteredFlats}
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

        {selectedFlat && ownershipTypes.length > 0 && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Select Ownership Type"
              value={selectedOwnershipType ? selectedOwnershipType.TypeName : ownershipSearchQuery}
              onFocus={() => setOwnershipDropdownVisible(true)}
              onChangeText={setOwnershipSearchQuery}
            />
            {ownershipDropdownVisible && (
              <FlatList
                data={filteredOwnershipTypes}
                keyExtractor={(item) => item._id?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => handleOwnershipSelect(item)}>
                    <Text style={styles.dropdownText}>{item.TypeName}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {selectedOwnershipType && occupancyStatuses.length > 0 && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Select Occupancy Status"
              value={selectedOccupancyStatus ? selectedOccupancyStatus.OSName : occupancySearchQuery}
              onFocus={() => setOccupancyDropdownVisible(true)}
              onChangeText={setOccupancySearchQuery}
            />
            {occupancyDropdownVisible && (
              <FlatList
                data={filteredOccupancyStatuses}
                keyExtractor={(item) => item._id?.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => handleOccupancySelect(item)}>
                    <Text style={styles.dropdownText}>{item.OSName}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            {selectedOccupancyStatus && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddHome}>
                <Text style={styles.addButtonText}>Add Home</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SelectSociety;

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
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
  addButton: {
    padding: 12,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});