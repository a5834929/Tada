// @flow

import React, { useState } from "react";
import { NativeModules, Text, View, Button } from "react-native";

export default function App() {
  const [count, setCount] = useState(0);
  const [resp, setResp] = useState("");

  const RNAuthNetSdk = NativeModules.RNAuthNetSdk;

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ margin: 5 }}>
        Hi there! You've pressed the button {count} times!
      </Text>
      <View style={{ margin: 5 }}>
        <Button onPress={() => setCount(count + 1)} title="Press!" />
      </View>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() =>
            RNAuthNetSdk.initAuthNet("test").then(itWorked =>
              setCount(count + itWorked ? 5 : -5)
            )
          }
          title="Mystery Button"
        />
      </View>
      <Text style={{ margin: 5 }}>{resp.length > 0 ? resp : "Nothing"}</Text>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() =>
            RNAuthNetSdk.getUnsettledTxnList().then(res => setResp(res))
          }
          title="Another Mystery!"
        />
      </View>
    </View>
  );
}
