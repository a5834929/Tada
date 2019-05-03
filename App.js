// @flow

import React, { useState, useEffect } from "react";
import {
  NativeModules,
  Text,
  View,
  Button,
  TextInput,
  Switch
} from "react-native";

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

export default function App() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [text, setText] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [anetIsInit, setAnetIsInit] = useState(false);
  const [deviceID, setDeviceID] = useState(null);

  useEffect(() => {
    getOrSetDeviceID().then(setDeviceID);
    return;
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
      <Text style={{ margin: 5 }}>{text.length > 0 ? text : "Nothing"}</Text>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() => RNAuthNetSDK.chargeIt().then(res => setText(res))}
          disabled={!anetIsInit}
          title="Another Mystery!"
        />
      </View>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() => RNAuthNetSDK.quickChip().then(res => setText(res))}
          disabled={!anetIsInit}
          title="...will...it...CHIP?!"
        />
      </View>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() => RNAuthNetSDK.doOTAUpdate()}
          title="Um.. update?"
        />
      </View>
    </View>
  );
}
