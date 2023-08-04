import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View } from 'react-native';
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import {MapDisplay} from "./app/Map.js";



/// df
const MainDisplay = props => {
  var display = <Text>no display {props.display}</Text>
  switch (props.display) {
    case "map":
      display = <MapDisplay />
      break;
    case "home":
      display = <Text>home</Text>
      break;
  }
  return (
    <View>
      <Text>Open up App.js to start working on your app!</Text>
      {display}
    </View>
  )
}

export default function App() {
  let display = "home"
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
      <MainDisplay  />
      <View id='footer'>
        <Button title="map" onPress={() => {display="map"}} />
        <Button title="home" onPress={() => {display="home"}} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flex: 1,
    backgroundColor: "#caa",
    alignItems: "center",
    justifyContent: "center",
    
  },
});
