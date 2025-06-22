import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { API_URL } from '@env';
import axios from 'axios';
import { getToken } from '../../utils/dbStore';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-native-toast-message';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '@react-navigation/native';

const PermissionRequest = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [blockDropdownVisible, setBlockDropdownVisible] = useState(false);
  const [unitDropdownVisible, setUnitDropdownVisible] = useState(false);
  const [blockSearchQuery, setBlockSearchQuery] = useState('');
  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        
        // Fetch user data
        const userResponse = await axios.get(`${API_URL}/users/${userId}`);
        setUserData(userResponse.data);
        
        // Fetch blocks for the society
        if (userResponse.data.SId) {
          fetchBlocks(userResponse.data.SId);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch user data',
        });
      }
    };

    fetchUserData();
  }, []);

  const fetchBlocks = async (societyId) => {
    try {
      const response = await axios.post(`${API_URL}/blocks/societyid`, {
        societyid: societyId
      });
      setBlocks(response.data);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch blocks',
      });
    }
  };

  const fetchUnits = async (blockId) => {
    try {
      const response = await axios.post(`${API_URL}/units/blockid`, {
        blockid: blockId
      });
      setUnits(response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch units',
      });
    }
  };

  const handleBlockSelect = (block) => {
    setSelectedBlock(block);
    setBlockSearchQuery(block.BlockName);
    setBlockDropdownVisible(false);
    fetchUnits(block._id);
  };

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setUnitSearchQuery(unit.FlatNumber);
    setUnitDropdownVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.purpose || !selectedUnit) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Form',
        text2: 'Please fill all required fields',
      });
      return;
    }

    try {
      const token = await getToken();
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      const requestData = {
        name: formData.name,
        purpose: formData.purpose,
        unitId: selectedUnit._id,
        createdby: userId
      };

      const response = await axios.post(`${API_URL}/permit-requests`, requestData);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Permission request submitted successfully',
      });
      
      // Reset form
      setFormData({ name: '', purpose: '' });
      setSelectedBlock(null);
      setSelectedUnit(null);
      setBlockSearchQuery('');
      setUnitSearchQuery('');
      
      // Navigate back or to another screen
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error submitting request:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit permission request',
      });
    }
  };

  const filteredBlocks = blocks.filter(block =>
    block.BlockName.toLowerCase().includes(blockSearchQuery.toLowerCase())
  );

  const filteredUnits = units.filter(unit =>
    unit.FlatNumber.toLowerCase().includes(unitSearchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Permission Request</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TextInput
          style={styles.input}
          placeholder="Visitor Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />

        <TextInput
          style={styles.input}
          placeholder="Purpose of Visit"
          value={formData.purpose}
          onChangeText={(text) => setFormData({ ...formData, purpose: text })}
          multiline
        />

        <Text style={styles.label}>Select Block</Text>
        <TextInput
          style={styles.input}
          placeholder="Select Block"
          value={blockSearchQuery}
          onFocus={() => setBlockDropdownVisible(true)}
          onChangeText={setBlockSearchQuery}
        />
        {blockDropdownVisible && (
          <FlatList
            data={filteredBlocks}
            keyExtractor={(item) => item._id}
            style={styles.dropdown}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem} onPress={() => handleBlockSelect(item)}>
                <Text style={styles.dropdownText}>{item.BlockName}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {selectedBlock && (
          <>
            <Text style={styles.label}>Select Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="Select Unit"
              value={unitSearchQuery}
              onFocus={() => setUnitDropdownVisible(true)}
              onChangeText={setUnitSearchQuery}
            />
            {unitDropdownVisible && (
              <FlatList
                data={filteredUnits}
                keyExtractor={(item) => item._id}
                style={styles.dropdown}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.listItem} onPress={() => handleUnitSelect(item)}>
                    <Text style={styles.dropdownText}>{item.FlatNumber}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PermissionRequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    maxHeight: 200,
    marginBottom: 16,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});