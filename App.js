// @flow

import React, { useState } from "react";
import { Text, View, Button } from "react-native";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Hi there! You've hit the button {count} times!</Text>
      <Button onPress={() => setCount(count + 1)} title="Press!" />
    </View>
  );
}
