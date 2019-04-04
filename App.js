/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator } from "react-native";
import { Button, ListItem } from "react-native-elements";
import Icon from "react-native-vector-icons/FontAwesome";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  truncateAbstract = (str) => {
    if(!str || str.length <= 80) return str;
    else{
      var sub = str.substring(0, 80);
      return sub.substring(0, sub.lastIndexOf(" ")) + "...";
    }
  };

  fetchData = async () => {
    fetch("https://give.imb.org/api/projects", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(responseJson => {
        setProjects(responseJson);
        setIsLoading(false);
      })
      .catch(error => {
        console.error(error);
      });
  };

  fetchProject = () => {
    setIsLoading(true);
    fetchData();
  }

  buttonOrLoading = () => {
    if(!isLoading){
      return (
        <Button
          title="View Projects"
          type="outline"
          onPress={this.fetchProject.bind(this)}
        />
      );
    }
    else return (<ActivityIndicator size="large" color="#868686"/>);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to Tada!</Text>
        {buttonOrLoading()}
      </View>
      
      <FlatList
        data={projects}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) =>
          <ListItem
            key={item.id}
            leftAvatar={{ source: { uri: item.url } }}
            title={item.title}
            subtitle={truncateAbstract(item.abstract)}
            subtitleStyle={styles.abstract}
            chevron
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  abstract: {
    fontSize: 12,
    color: "#868686"
  }
});
