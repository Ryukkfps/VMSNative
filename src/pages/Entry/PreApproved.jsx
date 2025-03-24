import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Share,
} from 'react-native';
import React, {useState} from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import {API_URL} from '@env';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const PreApproved = () => {
  const [formData, setFormData] = useState({
    Name: '',
    TimeSpanValue: '',
    TimeSpanUnit: 'hours',
  });

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    {label: 'Minutes', value: 'minutes'},
    {label: 'Hours', value: 'hours'},
    {label: 'Days', value: 'days'},
    {label: 'Months', value: 'months'},
  ]);

  const [passcodeRec, setPasscodeRec] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleSubmit = async () => {
    try {
      let minutes = parseInt(formData.TimeSpanValue);
      switch (formData.TimeSpanUnit) {
        case 'minutes':
          minutes *= 1;
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
      };

      console.log(`${API_URL}/entry-permits`);
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
    <View style={styles.container}>
      <Text style={styles.title}>Create Entry Permit</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={formData.Name}
        onChangeText={text => setFormData({...formData, Name: text})}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default PreApproved;
