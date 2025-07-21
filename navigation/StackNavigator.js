import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import Dashboard from '../screens/Dashboard';
import PainLogScreen from '../screens/PainLogScreen';
import PainHistoryScreen from '../screens/PainHistoryScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import PoseScreen from '../screens/PoseScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import InjuryManagementScreen from '../screens/InjuryManagementScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="PainLog" component={PainLogScreen} />
      <Stack.Screen name="PainHistory" component={PainHistoryScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Pose" component={PoseScreen} />
      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="InjuryManagement" component={InjuryManagementScreen} />
    </Stack.Navigator>
  );
}
