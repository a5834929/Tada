import React, { Component, useState } from "react";
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert } from "react-native";
import { Button, ListItem } from "react-native-elements";

function truncateAbstract(str) {
  if (!str || str.length <= 80) return str;
  else {
    var sub = str.substring(0, 80);
    return sub.substring(0, sub.lastIndexOf(" ")) + "...";
  }
}

function filterProjects(projects) {
  return projects.filter(item => item.is_active == true && item.available_online == true);
};

export default function Home(props) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = props.navigation.getParam('user');
  const deviceID = props.navigation.getParam('deviceID');

  fetchData = async () => {
    fetch("https://sbgive-staging-pr-1223.herokuapp.com/api/projects", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(responseJson => {
        setProjects(filterProjects(responseJson));
        setIsLoading(false);
      })
      .catch(error => {
        console.error(error);
      });
  };

  fetchProject = () => {
    setIsLoading(true);
    fetchData();
  };

  buttonOrLoading = () => {
    if (!isLoading) {
      return (
        <Button
          title="View Projects"
          type="outline"
          onPress={this.fetchProject.bind(this)}
        />
      );
    } else return <ActivityIndicator size="large" color="#868686" />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome to Tada!</Text>
        {buttonOrLoading()}
      </View>

      <FlatList
        data={projects}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ListItem
            key={item.id}
            leftAvatar={{ source: { uri: item.url } }}
            title={item.title}
            subtitle={truncateAbstract(item.abstract)}
            subtitleStyle={styles.abstract}
            containerStyle={{backgroundColor: '#F5FCFF'}}
            chevron
            bottomDivider
            onPress={() => props.navigation.navigate('Project', {project: item, user: user, deviceID: deviceID})}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5FF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  abstract: {
    fontSize: 12,
    color: "#868686"
  }
});

