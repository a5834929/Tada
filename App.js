// @flow

import React, { useState } from "react";
import {
  NativeModules,
  Text,
  View,
  Button,
  TextInput,
  Switch
} from "react-native";

export default function App() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [resp, setResp] = useState("");
  const [isLive, setIsLive] = useState(false);

  const RNAuthNetSdk = NativeModules.RNAuthNetSdk;

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
            RNAuthNetSdk.initAuthNet(isLive ? "live" : "test", user, pass).then(
              itWorked =>
                setResp(`Init ${itWorked ? "worked" : "didn't work"}!`)
            )
          }
          title="Mystery Button"
        />
      </View>
      <Text style={{ margin: 5 }}>{resp.length > 0 ? resp : "Nothing"}</Text>
      <View style={{ margin: 5 }}>
        <Button
          onPress={() => RNAuthNetSdk.chargeIt().then(res => setResp(res))}
          title="Another Mystery!"
        />
      </View>
    </View>
  );
}
