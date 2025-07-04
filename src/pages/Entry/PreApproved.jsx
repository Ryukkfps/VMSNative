import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Share,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import {API_URL} from '@env';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import {getToken} from '../../utils/dbStore';
import {jwtDecode} from 'jwt-decode';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';

const PreApproved = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    Name: '',
    TimeSpanValue: '',
    TimeSpanUnit: 'hours',
  });

  const [date, setDate] = useState(new Date());

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    {label: 'Minutes', value: 'minutes'},
    {label: 'Hours', value: 'hours'},
    {label: 'Days', value: 'days'},
    {label: 'Months', value: 'months'},
  ]);

  const [passcodeRec, setPasscodeRec] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [selectedHome, setSelectedHome] = useState(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    console.log('TimeSpanUnit:', formData.TimeSpanUnit);
  }, [formData.TimeSpanUnit]);

  useEffect(() => {
    const fetchSelectedHome = async () => {
      try {
        const homeObject = await AsyncStorage.getItem('selectedHomeObject');
        if (homeObject) {
          const parsedHome = JSON.parse(homeObject);
          setSelectedHome(parsedHome);
          console.log('Selected Home:', parsedHome);
        } else {
          console.warn('No selected home found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error fetching selected home:', error);
      }
    };

    fetchSelectedHome();
  }, []);




  const handleSubmit = async () => {
    try {
      console.log("")
      // Check if a home is selected
      if (!selectedHome) {
        Toast.show({
          type: 'error',
          text1: 'No Home Selected',
          text2: 'Please select a home first to create an entry permit.',
          position: 'bottom',
          visibilityTime: 3000,
        });
        return;
      }

      const token = await getToken();
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      let minutes = parseInt(formData.TimeSpanValue);
      switch (formData.TimeSpanUnit) {
        case 'minutes':
          minutes *= 1;
          break;
        case 'hours':
          minutes *= 60;
          break;
        case 'days':
          minutes *= 1440; // 24 * 60
          break;
        case 'months':
          minutes *= 43200; // 30 * 24 * 60
          break;
      }
      const timeSpan = minutes;
      const submitData = {
        Name: formData.Name,
        TimeSpan: timeSpan,
        UserId: userId,
        UId: selectedHome.UId?._id || selectedHome.UId, // Include UId from selected home
        DateTime : date,
      };
      console.log(date.getDate)
      console.log(submitData);

      const response = await axios.post(
        `${API_URL}/entry-permits`,
        submitData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const data = await response.data;
      setPasscode(data.PassCode);
      setPasscodeRec(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Entry permit created successfully',
        position: 'bottom',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `
You are co-ordially invited to My Home \n
Here is your passcode: ${passcode} \n
Please Share it at the gate with the guard`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Entry Permit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>

      {selectedHome && (
        <View style={styles.selectedHomeContainer}>
          <Text style={styles.selectedHomeTitle}>Selected Home:</Text>
          <Text style={styles.selectedHomeText}>
            {selectedHome.SId?.SocietyName || 'N/A'} - {selectedHome.BId?.BlockName || 'N/A'} - {selectedHome.UId?.FlatNumber || 'N/A'}
          </Text>
          <Text style={styles.changeHomeText}>
            To change home, please go to the home selection menu
          </Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={formData.Name}
        onChangeText={text => setFormData({...formData, Name: text})}
      />

      <DatePicker date={date} onDateChange={setDate} />
      <Text style={styles.label}>Time Duration</Text>
      <View style={styles.timeSpanContainer}>
        <TextInput
          style={styles.numberInput}
          placeholder="Enter number"
          keyboardType="numeric"
          value={formData.TimeSpanValue}
          onChangeText={text => setFormData({...formData, TimeSpanValue: text})}
        />

        <DropDownPicker
          open={open}
          value={formData.TimeSpanUnit}
          items={items}
          setOpen={setOpen}
          setValue={callback =>
            setFormData({
              ...formData,
              TimeSpanUnit: callback(formData.TimeSpanUnit),
            })
          }
          setItems={setItems}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholder="Select unit"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Generate Entry Permit</Text>
      </TouchableOpacity>

      {passcodeRec ? (
        <View style={styles.passcodeContainer}>
          <Text style={styles.passcodeText}>Passcode: {passcode}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Passcode</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    margin: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#FFC107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#555',
  },
  timeSpanContainer: {
    marginBottom: 20,
  },
  numberInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  passcodeContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  passcodeText: {
    fontSize: 18,
    color: '#00796b',
    marginBottom: 10,
  },
  shareButton: {
    backgroundColor: '#00796b',
    padding: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedHomeContainer: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedHomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedHomeText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  changeHomeText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});

export default PreApproved;
