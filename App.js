// @flow

import React, { useState } from "react";
import { NativeModules, Text, View, Button } from "react-native";

export default function App() {
  const [count, setCount] = useState(0);

  const RNAuthNetSdk = NativeModules.RNAuthNetSdk;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Hi there! You've hit the button {count} times!</Text>
      <Button onPress={() => setCount(count + 1)} title="Press!" />
      <Button
        onPress={() => RNAuthNetSdk.doTheThing("cool", "gusto")}
        title="Mystery Button"
      />
    </View>
  );
}
