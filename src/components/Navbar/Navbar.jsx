import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faBuilding,
  faUserCircle,
  faBell,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import {getToken, removeToken} from '../../utils/dbStore';
import {jwtDecode} from 'jwt-decode';
import axios from 'axios';
import {API_URL} from '@env';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const Navbar = () => {
  const navigation = useNavigation();
  const [buildingDropdownVisible, setBuildingDropdownVisible] = useState(false);
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const [userHomes, setUserHomes] = useState([]);
  const [userData, setUserData] = useState(null);
  const [selectedHomeId, setSelectedHomeId] = useState(null);
  const[unviewedNoticount,setUnviewedNoticount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        // Get selected home from AsyncStorage


        // Fetch user data and homes data separately to handle errors independently
        try {
          const userResponse = await axios.get(`${API_URL}/users/${userId}`);
          setUserData(userResponse.data);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
        }

        const storedHomeId = await AsyncStorage.getItem('selectedHomeId');
        if (storedHomeId) {
          setSelectedHomeId(storedHomeId);
        }

        try {
          const homesResponse = await axios.get(
            `${API_URL}/homes/user/${userId}`,
          );
          setUserHomes(homesResponse.data || []);

          // If no home is selected yet but homes exist, select the first one
          if (
            !storedHomeId &&
            homesResponse.data &&
            homesResponse.data.length > 0
          ) {
            const firstHomeId = homesResponse.data[0]._id;
            if (firstHomeId) {
              // Add check to ensure firstHomeId is not undefined
              setSelectedHomeId(firstHomeId);
              await AsyncStorage.setItem('selectedHomeId', firstHomeId);
            }
          }
        } catch (homesError) {
          // console.error('Error fetching homes data:', homesError);
          setUserHomes([]);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };

    const fetchNotificationCount = async () => {
      try {
        const token = await getToken();
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;

        const response = await axios.get(`${API_URL}/notifications/user/status/${userId}`);
        console.log(response.data);
        setUnviewedNoticount(response.data.count);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchData();
    fetchNotificationCount();
  }, []); // Only run on component mount

  const handleHomeSelect = async homeId => {
    if (homeId) {
      setSelectedHomeId(homeId);
      await AsyncStorage.setItem('selectedHomeId', homeId);

      // Find the selected home object by _id
      const selectedHome = userHomes.find(home => home._id === homeId);
      if (selectedHome) {
        await AsyncStorage.setItem('selectedHomeObject', JSON.stringify(selectedHome));
      } else {
        console.warn('Selected home object not found for homeId:', homeId);
      }

      setBuildingDropdownVisible(false);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }], // replace 'Home' with your main entry route
        })
      );
    } else {
      console.warn('Attempted to select undefined homeId');
    }
  };

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

  const handleDropdownToggle = dropdownType => {
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
      await AsyncStorage.removeItem('selectedHomeId');
      await AsyncStorage.removeItem('selectedHomeObject');
      navigation.reset({
        index: 0,
        routes: [{name: 'GetStarted'}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const renderHomeItem = ({ item }) => {
    const isPending = item.status === false;
    return (
      <TouchableOpacity
        style={[
          styles.homeItem,
          selectedHomeId === item._id && styles.selectedHomeItem,
          isPending && styles.disabledHomeItem,
        ]}
        onPress={() => !isPending && handleHomeSelect(item._id)}
        activeOpacity={isPending ? 1 : 0.2}
        disabled={isPending}
      >
        <View style={styles.homeItemContent}>
          <View>
            <Text style={[styles.societyName, isPending && styles.disabledText]}>
              {item.SId?.SocietyName || 'N/A'}
            </Text>
            <Text style={[styles.homeDetails, isPending && styles.disabledText]}>
              {item.BId?.BlockName || 'N/A'} - {item.UId?.FlatNumber || 'N/A'}
            </Text>
            <Text style={[styles.homeType, isPending && styles.disabledText]}>
              {item.OwnershipType?.TypeName || 'N/A'} • {item.OccupancyStatus?.OSName || 'N/A'}
            </Text>
            {isPending && (
              <Text style={styles.pendingApprovalLabel}>Pending Approval</Text>
            )}
          </View>
          {selectedHomeId === item._id && !isPending && (
            <FontAwesomeIcon icon={faCheck} size={16} color="#007AFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
                style={[
                  styles.addHomeButton,
                  {
                    padding: 15,
                    borderTopWidth: 1,
                    borderTopColor: '#eee',
                    width: '100%',
                    alignItems: 'center',
                  },
                ]}
                onPress={() => navigation.navigate('AddHome')}>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#007AFF',
                    fontWeight: '500',
                  }}>
                  + Add a Flat or Apartment
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={styles.spacer} />

      <TouchableOpacity
        onPress={() => navigation.navigate('Notifications')}
        style={[styles.iconContainer, styles.notificationContainer]}>
        <FontAwesomeIcon icon={faBell} size={24} style={styles.icon} />
        {unviewedNoticount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{unviewedNoticount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleDropdownToggle('profile')}
        style={styles.iconContainer}>
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
              <Text style={styles.userName}>
                {userData?.Name || 'Loading...'}
              </Text>
              <Text style={styles.userEmail}>{userData?.Email || ''}</Text>
            </View>
            <View style={styles.menuItemsContainer}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>Profile Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}>
                <Text style={[styles.menuItemText, styles.logoutText]}>
                  Logout
                </Text>
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
  disabledHomeItem: {
    backgroundColor: '#f8d7da',
    opacity: 0.7,
  },
  disabledText: {
    color: '#aaa',
  },
  pendingApprovalLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#d9534f',
    fontWeight: 'bold',
  },
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
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
  selectedHomeItem: {
    backgroundColor: '#f0f8ff',
  },
  homeItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
  rightAlignedMenu: {},
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
