import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import GetStarted from '../pages/GetStarted/GetStarted';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import HomePage from '../pages/HomePage/HomePage';
import AddHome from '../pages/AddHome/AddHome';
import SelectSociety from '../pages/AddHome/SelectSociety';
import Notifications from '../pages/Notifications/Notifications';
import PreApproved from '../pages/Entry/PreApproved';
import PermissionRequest from '../pages/GatePermission/PermissionRequest';
import CreatePost from '../pages/BlogPosting/CreatePost';
import PostDetail from '../pages/BlogPosting/PostDetail';
import GatePassVerification from '../pages/GatePermission/GatePassVerification';
import Feedback from '../pages/Feedback/Feedback';
import ChatScreen from '../pages/DirectMessage/ChatScreen';
import ContactListScreen from '../pages/DirectMessage/ContactListScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ navigationRef }) => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="GetStarted"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}>
        <Stack.Screen name="GetStarted" component={GetStarted} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen name="AddHome" component={AddHome} />
        <Stack.Screen name="SelectSociety" component={SelectSociety} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="PreApproved" component={PreApproved} />
        <Stack.Screen name="PermissionRequest" component={PermissionRequest} />
        <Stack.Screen name="CreatePost" component={CreatePost} />
        <Stack.Screen name="PostDetail" component={PostDetail} />
        <Stack.Screen
          name="GatePassVerification"
          component={GatePassVerification}
        />
        <Stack.Screen name="Feedback" component={Feedback} />
        <Stack.Screen
          name="ContactListScreen"
          component={ContactListScreen}
          options={{title: 'Direct Messages'}}
        />
        <Stack.Screen
          name="ChatScreen"
          component={ChatScreen}
          options={({route}) => ({title: route.params?.other?.name || 'Chat'})}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
