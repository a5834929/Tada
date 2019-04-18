import {AppRegistry} from 'react-native';
import { createStackNavigator, createAppContainer } from "react-navigation";
import {name as appName} from './app.json';
import Home from './Home';
import Login from './Login';
import Project from './Project';

const AppNavigator = createStackNavigator(
  {
    Login: Login,
    Home: Home,
    Project: Project
  },
  {
    initialRouteName: "Login"
  }
);

AppRegistry.registerComponent(appName, () => createAppContainer(AppNavigator));
