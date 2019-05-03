import React, { Component, useState } from "react";
import { StyleSheet, View, ScrollView, Text, Image, ActivityIndicator, NativeModules } from "react-native";
import { Card, ListItem, Button, Icon, Input } from "react-native-elements";

export default function ProjectPage(props) {
  const [text1, setText1] = useState("Authenticate Yourself");
  const [text2, setText2] = useState("GIVE");
  const [anetIsInit, setAnetIsInit] = useState(false);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const project = props.navigation.getParam('project', {title: "No Project", abstract: "", url: ""});
  const { username, password } = props.navigation.getParam('user');
  const deviceID = props.navigation.getParam('deviceID');
  const RNAuthNetSDK = NativeModules.RNAuthNetSDK;

  fetchData = async () => {
    fetch("https://sbgive-staging-pr-1260.herokuapp.com/api/charge/kiosk-app", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "name": name,
        "email": email,
      })
    })
      .then(response => response.json())
      .then(responseJson => {
        setText1(responseJson.email);
      })
      .catch(error => {
        console.error(error);
      });
  };

  return (
    <ScrollView style={styles.container}>
      <Card title={project.title} containerStyle={styles.card}>
        <Image
          source={{ uri: project.url }}
          style={{ width: "100%", height: 200, marginBottom: 10 }}
          resizeMode={"contain"}
        />
        <Text style={{ marginBottom: 20 }}>{project.abstract}</Text>
        <Button
          // onPress={() =>
          //   RNAuthNetSDK.initAuthNet(
          //     "test",
          //     deviceID,
          //     username,
          //     password
          //   ).then(itWorked => {
          //     setText1(`Init ${itWorked ? "worked" : "didn't work"}!`);
          //     setAnetIsInit(true);
          //   })
          // }
          // disabled={deviceID == null}
          title={text1}
        />
        <Input
          label="Name"
          leftIconContainerStyle={{margidfnRight: 20}}
          containerStyle={{marginBottom: 20, marginTop: 20}}
          autoCapitalize={"none"}
          autoFocus={true}
          onChangeText={setName}
          value={name}
        />
        <Input
          label="Email"
          leftIconContainerStyle={{marginRight: 20}}
          containerStyle={{marginBottom: 20}}
          autoCapitalize={"none"}
          autoFocus={true}
          onChangeText={setEmail}
          value={email}
        />
        <Button
          buttonStyle={{ marginTop: 10 }}
          onPress={() => fetchData()}
          // onPress={() => RNAuthNetSDK.chargeIt().then(res => setText2(res))}
          // disabled={!anetIsInit}
          title={text2}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5FF"
  },
  card: {
    marginTop: 30,
    marginBottom:30
  },
});
