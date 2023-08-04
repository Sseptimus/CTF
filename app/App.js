import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import {MapDisplay} from "./app/Map.js";


const MainDisplay = () => {
  return (
    <View>
      <Text>Open up App.js to start working on your app!</Text>
      
    </View>
  )
}

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
      <View id='footer'>
        <Text>map|home|settings|ect</Text>
      </View>
      <MapDisplay />
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
