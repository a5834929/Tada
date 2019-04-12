import React, { Component, useState } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator } from "react-native";
import { Card, ListItem, Button, Icon } from "react-native-elements";

export default function ProjectPage(props) {
  const project = props.navigation.getParam('project', {title: "No Project", abstract: "", url: ""});

  return (
    <View style={styles.container}>
      <Card title={project.title} containerStyle={styles.card}>
        <Image
          source={{ uri: project.url }}
          style={{ width: "100%", height: 200, marginBottom: 10 }}
          resizeMode={"contain"}
        />
        <Text style={{ marginBottom: 20 }}>{project.abstract}</Text>
        <Button title="GIVE"/>
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
