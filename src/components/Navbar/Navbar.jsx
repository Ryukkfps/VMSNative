import { StyleSheet, Text, View, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBuilding, faUserCircle, faBell } from '@fortawesome/free-solid-svg-icons';
import { getToken, removeToken } from '../../utils/dbStore';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Navbar = () => {
  const navigation = useNavigation();
  const [buildingDropdownVisible, setBuildingDropdownVisible] = useState(false);
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const [userHomes, setUserHomes] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        // Fetch both user data and homes data in parallel
        const [userResponse, homesResponse] = await Promise.all([
          axios.get(`${API_URL}/users/${userId}`),
          axios.get(`${API_URL}/homes/user/${userId}`)
        ]);

        setUserData(userResponse.data);
        setUserHomes(homesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []); // Only run on component mount

  const toggleBuildingDropdown = () => {
    setBuildingDropdownVisible(!buildingDropdownVisible);
    if (profileDropdownVisible) {
      setProfileDropdownVisible(false);
    }
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownVisible(!profileDropdownVisible);
    if (buildingDropdownVisible) {
      setBuildingDropdownVisible(false);
    }
  };

  const handleDropdownToggle = (dropdownType) => {
    if (dropdownType === 'building') {
      setBuildingDropdownVisible(!buildingDropdownVisible);
      setProfileDropdownVisible(false);
    } else if (dropdownType === 'profile') {
      setProfileDropdownVisible(!profileDropdownVisible);
      setBuildingDropdownVisible(false);
    }
  };

  const handleLogout = async () => {
    try {
      await removeToken();
      navigation.reset({
        index: 0,
        routes: [{ name: 'GetStarted' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const renderHomeItem = ({ item }) => (
    <View style={styles.homeItem}>
      <Text style={styles.societyName}>{item.Society}</Text>
      <Text style={styles.homeDetails}>
        {item.Block} - {item.Unit}
      </Text>
      <Text style={styles.homeType}>
        {item.OwnershipType} • {item.OccupancyStatus}
      </Text>
    </View>
  );

  return (
    <View style={styles.navbar}>
      <TouchableOpacity 
        onPress={() => handleDropdownToggle('building')} 
        style={styles.iconContainer}
      >
        <FontAwesomeIcon icon={faBuilding} size={24} style={styles.icon} />
      </TouchableOpacity>
      {buildingDropdownVisible && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={() => setBuildingDropdownVisible(false)} 
          />
          <View style={styles.dropdownMenu}>
            {userHomes.length > 0 ? (
              <FlatList
                data={userHomes}
                renderItem={renderHomeItem}
                keyExtractor={(item, index) => index.toString()}
                style={styles.homesList}
              />
            ) : (
              <Text style={styles.noHomesText}>No homes registered</Text>
            )}
            <View>
              <TouchableOpacity 
                style={[styles.addHomeButton, {
                  padding: 15,
                  borderTopWidth: 1,
                  borderTopColor: '#eee',
                  width: '100%',
                  alignItems: 'center'
                }]}
                onPress={() => navigation.navigate('AddHome')}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#007AFF',
                  fontWeight: '500'
                }}>+ Add a Flat or Apartment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={styles.spacer} />

      <TouchableOpacity 
        onPress={() => navigation.navigate('Notifications')} 
        style={[styles.iconContainer, styles.notificationContainer]}
      >
        <FontAwesomeIcon icon={faBell} size={24} style={styles.icon} />
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>3</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => handleDropdownToggle('profile')} 
        style={styles.iconContainer}
      >
        <FontAwesomeIcon icon={faUserCircle} size={24} style={styles.icon} />
      </TouchableOpacity>
      {profileDropdownVisible && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            onPress={() => setProfileDropdownVisible(false)} 
          />
          <View style={[styles.dropdownMenu, styles.rightAlignedMenu]}>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{userData?.Name || 'Loading...'}</Text>
              <Text style={styles.userEmail}>{userData?.Email || ''}</Text>
            </View>
            <View style={styles.menuItemsContainer}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>Profile Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutItem]} 
                onPress={handleLogout}
              >
                <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

export default Navbar;

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
  },
  iconContainer: {
    padding: 5,
  },
  icon: {
    width: 24,
    height: 24,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    zIndex: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
    maxHeight: 300,
  },
  homesList: {
    width: '100%',
  },
  homeItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  societyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  homeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  homeType: {
    fontSize: 12,
    color: '#888',
  },
  noHomesText: {
    textAlign: 'center',
    color: '#666',
    padding: 10,
  },
  spacer: {
    flex: 1,
  },
  rightAlignedMenu: {
  },
  userInfoContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuItemsContainer: {
    marginTop: 8,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
  },
  notificationContainer: {
    position: 'relative',
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});