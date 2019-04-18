import React, { Component, useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator, NativeModules } from "react-native";
import { Card, ListItem, Button, Icon } from "react-native-elements";
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

export default function ProjectPage(props) {
  const [text, setText] = useState("GIVE")
  const [isLive, setIsLive] = useState(false);
  const [anetIsInit, setAnetIsInit] = useState(false);
  const [deviceID, setDeviceID] = useState(null);
  const project = props.navigation.getParam('project', {title: "No Project", abstract: "", url: ""});

  useEffect(() => {
    getOrSetDeviceID().then(setDeviceID);
    return;
  }, []);

  const RNAuthNetSDK = NativeModules.RNAuthNetSDK;

  return (
    <View style={styles.container}>
      <Card title={project.title} containerStyle={styles.card}>
        <Image
          source={{ uri: project.url }}
          style={{ width: "100%", height: 200, marginBottom: 10 }}
          resizeMode={"contain"}
        />
        <Text style={{ marginBottom: 20 }}>{project.abstract}</Text>
        <Button
          onPress={() => RNAuthNetSDK.chargeIt().then(res => console.log(res))}
          title={text}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5FF"
  },
  card: {
    marginTop: 60
  }
});
