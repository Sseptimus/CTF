// import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Button, TextInput, Text } from "react-native";
import { registerRootComponent } from "expo";
import React, { useState, useEffect, Component } from "react";
import ReactNativeForegroundService from "@supersami/rn-foreground-service";
ReactNativeForegroundService.register();

function update() {
  console.log("Updating notification");
}

function App() {
  
  ReactNativeForegroundService.add_task(() => update(), {
    delay: 1000,
    onLoop: true,
    taskId: "taskid",
    onError: (e) => console.log(`Error logging:`, e),
  });

  ReactNativeForegroundService.start({
    id: 1244,
    title: "Foreground Service",
    message: "We are live World",
    icon: "ic_launcher",
    button: true,
    button2: true,
    buttonText: "Button",
    button2Text: "Anther Button",
    buttonOnPress: "cray",
    setOnlyAlertOnce: true,
    color: "#000000",
    progress: {
      max: 100,
      curr: 50,
    },
  }).catch((err) => console.log('error in init',err));

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
    </View>
  )
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  space: {
    flex: 0.1,
  },
});