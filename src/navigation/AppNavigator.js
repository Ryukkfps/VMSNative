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
import DMList from '../pages/DirectMessage/DMList';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
        <Stack.Screen name="DirectMessages" component={DMList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
