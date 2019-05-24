// @flow

import React, { useState, useEffect } from "react";
import {
  NativeModules,
  Text,
  View,
  Button,
  TextInput,
  Switch,
  NativeEventEmitter
} from "react-native";

import AsyncStorage from "@react-native-community/async-storage";
import UUIDGenerator from "react-native-uuid-generator";
import IDTECH_MSR_audio from "react-native-idtech-msr-audio";

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

export default function App() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [isLive, setIsLive] = useState(false);
  const [anetIsInit, setAnetIsInit] = useState(false);
  const [deviceID, setDeviceID] = useState(null);
  const [blob, setBlob] = useState("");

  useEffect(() => {
    getOrSetDeviceID().then(setDeviceID);
    return;
  }, []);

  useEffect(() => {
    console.log("Starting hook for setting up card reader.");
    const IdTechEvent = new NativeEventEmitter(NativeModules.IDTECH_MSR_audio);
    this.idTechEventSub = IdTechEvent.addListener(
      "IdTechUniMagEvent",
      response => {
        console.log(
          `IDTECH_MSR_audio event notification: ${JSON.stringify(response)}`
        );
        switch (response.type) {
          case "umConnection_connected":
            console.log("Card reader connected. Initiating swipe detection...");
            IDTECH_MSR_audio.swipe();
            break;
          case "umSwipe_receivedSwipe":
            console.log("Successfully received swipe.");
            console.log(`Got data: ${JSON.stringify(response.data)}`);
            setBlob(response.data.tracks[0]);
            break;
          default:
            console.log(`Unknown event type received: ${response.type}`);
        }
      }
    );
    console.log("Set this.idTechEventSub.");
    console.log("Attempting to activate the card reader...");

    IDTECH_MSR_audio.activate(4, 0, true).then(response =>
      console.log(
        `IDTECH_MSR_audio activation response: ${JSON.stringify(response)}`
      )
    );

    return () => {
      console.log(`this.idTechEventSub is: ${this.idTechEventSub}`);
      this.idTechEventSub.remove();
      IDTECH_MSR_audio.deactivate();
    };
  }, []);

  const RNAuthNetSDK = NativeModules.RNAuthNetSDK;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TextInput
        style={{ height: 40, margin: 5 }}
        onChangeText={setUser}
        value={user}
        placeholder="Username"
        autoCapitalize="none"
        autoComplete="username"
        autoFocus={true}
        textContentType="username"
      />
      <TextInput
        style={{ height: 40, margin: 5 }}
        onChangeText={setPass}
        value={pass}
        placeholder="Password"
        autoCapitalize="none"
        autoComplete="password"
        secureTextEntry={true}
        textContentType="password"
      />
      <Switch onValueChange={setIsLive} style={{ margin: 5 }} value={isLive} />
      <View style={{ margin: 5 }}>
        <Button
          onPress={() =>
            RNAuthNetSDK.initAuthNet(
              isLive ? "live" : "test",
              deviceID,
              user,
              pass
            ).then(itWorked => {
              setText(`Init ${itWorked ? "worked" : "didn't work"}!`);
              setAnetIsInit(true);
            })
          }
          disabled={deviceID == null}
          title="Mystery Button"
        />
      </View>
      <TextInput
        style={{ height: 40, margin: 5 }}
        onChangeText={setAmount}
        value={amount}
        placeholder="0.01"
      />
      <Text style={{ margin: 5 }}>{text.length > 0 ? text : "Nothing"}</Text>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() =>
            RNAuthNetSDK.swipeIt(blob, amount).then(res => setText(res))
          }
          disabled={!anetIsInit}
          title="Another Mystery!"
        />
      </View>
    </View>
  );
}
