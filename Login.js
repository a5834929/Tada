import React, { Component, useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator, Alert } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Input, Button } from "react-native-elements";
import AsyncStorage from "@react-native-community/async-storage";
import UUIDGenerator from "react-native-uuid-generator";

async function getOrSetDeviceID(setter) {
  try {
    console.log("Trying to get device ID");
    const id = await AsyncStorage.getItem("@deviceID");
    if (id !== null) {
      console.log(`Got device ID! ${id}`);
      return id;
    } else {
      console.log("Device ID was null, generating a new one");
      const newID = await UUIDGenerator.getRandomUUID();
      console.log(`Generated new UUID: ${newID}`);
      try {
        console.log("Trying to set in storage...");
        await AsyncStorage.setItem("@deviceID", newID);
        console.log("Set!");
        return newID;
      } catch (setE) {
        console.error(`Error setting device ID in storage! ${setE}`);
      }
    }
  } catch (getE) {
    console.error(`Error retrieving or generating device ID! ${getE}`);
  }
}

function validate(username, password){
  return username!=="" && password!=="";
}

export default function Login(props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceID, setDeviceID] = useState(null);

  useEffect(() => {
    getOrSetDeviceID().then(setDeviceID);
    return;
  }, []);

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
          onChangeText={setUsername}
          value={username}
        />
        <Input
          label="Password"
          leftIcon={<Icon name="lock" size={24} color="black" />}
          leftIconContainerStyle={{marginRight: 20}}
          containerStyle={{marginBottom: 20}}
          autoCapitalize={"none"}
          secureTextEntry={true}
          onChangeText={setPassword}
          value={password}
        />
        <Button style={styles.button}
          title="Login" 
          type="outline"
          onPress={() => {
            if (validate(username, password)){
              props.navigation.navigate('Home', {user: {username: username, password: password},
                                                 deviceID: deviceID});
            }
            else Alert.alert("Both values are required!");
          }}
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

