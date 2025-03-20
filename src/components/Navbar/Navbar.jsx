import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBuilding, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const Navbar = () => {
  const [buildingDropdownVisible, setBuildingDropdownVisible] = useState(false);
  const [profileDropdownVisible, setProfileDropdownVisible] = useState(false);

  const toggleBuildingDropdown = () => {
    setBuildingDropdownVisible(!buildingDropdownVisible);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownVisible(!profileDropdownVisible);
  };

  return (
    <View style={styles.navbar}>
      <TouchableOpacity onPress={toggleBuildingDropdown} style={styles.iconContainer}>
        <FontAwesomeIcon icon={faBuilding} size={24} style={styles.icon} />
      </TouchableOpacity>
      {buildingDropdownVisible && (
        <View style={styles.dropdownMenu}>
          <Text>Building Menu Item 1</Text>
          <Text>Building Menu Item 2</Text>
        </View>
      )}

      <View style={styles.spacer} />

      <TouchableOpacity onPress={toggleProfileDropdown} style={styles.iconContainer}>
        <FontAwesomeIcon icon={faUserCircle} size={24} style={styles.icon} />
      </TouchableOpacity>
      {profileDropdownVisible && (
        <View style={styles.dropdownMenu}>
          <Text>Profile Menu Item 1</Text>
          <Text>Profile Menu Item 2</Text>
        </View>
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
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  spacer: {
    flex: 1,
  },
});