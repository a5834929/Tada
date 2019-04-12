import React, { Component, useState } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator, Alert } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Input, Button } from "react-native-elements";
import { createStackNavigator, createAppContainer } from "react-navigation";
import Home from './Home';
import ProjectPage from './Project';

function Login(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  validate = () => {
    if (username!=="" && password!==""){
      // Alert.alert("OK!");
      props.navigation.navigate('Home');
    }
    else Alert.alert("Both values are required!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.input}>
        <Input
          label="Username"
          leftIcon={<Icon name="user" size={24} color="black" />}
          leftIconContainerStyle={{marginRight: 20}}
          containerStyle={{marginBottom: 20}}
          autoCapitalize={"none"}
          autoFocus={true}
          onChangeText={(text) => setUsername(text)}
        />
        <Input
          label="Password"
          leftIcon={<Icon name="lock" size={24} color="black" />}
          leftIconContainerStyle={{marginRight: 20}}
          containerStyle={{marginBottom: 20}}
          autoCapitalize={"none"}
          secureTextEntry
          onChangeText={(text) => setPassword(text)}
        />
        <Button style={styles.button}
          title="Login"
          type="outline"
          onPress={() => validate()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5FF"
  },
  input: {
    marginTop: 60,
  },
  button: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center"
  },
});

const AppNavigator = createStackNavigator(
  {
    Login: Login,
    Home: Home,
    Project: ProjectPage
  },
  {
    initialRouteName: "Login"
  }
);

export default createAppContainer(AppNavigator);

