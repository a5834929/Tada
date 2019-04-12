// import React, { Component } from 'react';
// import { Platform, StyleSheet, Text, View } from 'react-native';
// import { createStackNavigator } from 'react-navigation';
// import ProjectPage from './Project';
// import Home from './Home';

// const AppNavigator = createStackNavigator({
//   HomeScreen: { screen: Home },
//   ProjectScreen: { screen: ProjectPage }
// });

// export default class App extends Component {
//   render() {
//     return (
//       <AppNavigator />
//     );
//   }
// }

import React from "react";
import { View, Text } from "react-native";
import { createStackNavigator, createAppContainer } from "react-navigation";
import Home from './Home';
import ProjectPage from './Project';
import Login from './Login';

const AppNavigator = createStackNavigator({
  Home: {
    screen: Home,
  },
  Project: {
    screen: ProjectPage,
  },
  Login: {
    screen: Login,
  }
}, {
    initialRouteName: 'Login',
});

export default createAppContainer(AppNavigator);