import React, { Component, useState } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator, NativeModules } from "react-native";
import { Card, ListItem, Button, Icon } from "react-native-elements";

export default function ProjectPage(props) {
  const [text1, setText1] = useState("Authenticate Yourself");
  const [text2, setText2] = useState("GIVE");
  const [anetIsInit, setAnetIsInit] = useState(false);
  const project = props.navigation.getParam('project', {title: "No Project", abstract: "", url: ""});
  const { username, password } = props.navigation.getParam('user');
  const deviceID = props.navigation.getParam('deviceID');
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
          onPress={() =>
            RNAuthNetSDK.initAuthNet(
              "test",
              deviceID,
              username,
              password
            ).then(itWorked => {
              setText1(`Init ${itWorked ? "worked" : "didn't work"}!`);
              setAnetIsInit(true);
            })
          }
          disabled={deviceID == null}
          title={text1}
        />
        <Button
          buttonStyle={{ marginTop: 10 }}
          onPress={() => RNAuthNetSDK.chargeIt().then(res => setText2(res))}
          disabled={!anetIsInit}
          title={text2}
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
    marginTop: 30
  },
});
