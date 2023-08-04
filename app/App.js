import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text, View} from 'react-native';
// import { MapContainer, TileLayer, useMap } from "react-leaflet";
import {MapDisplay} from "./Map.js";



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
    <View style={styles.main}>
      <Text>Open up App.js to start working on your app!</Text>
      {display}
    </View>
  )
}

export default function App() {
  let display = "home"
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <MainDisplay />
      <View style={styles.footer}>
        <Button
          title="map"
          onPress={() => {
            display = "map";
          }}
        />
        <Button
          title="home"
          onPress={() => {
            display = "home";
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#fff",
    // alignItems: "center",
    // justifyContent: "center",
    height: "100%",
  },
  footer: {
    display: "flex",
    position: "relative",
    // height: 100,
    borderTopColor: "#000",
    borderTopWidth: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    bottom: 0,
    padding: 20,
    gap: 20,
    width: "100%",
  },
  main: {
    display: "flex",
    alignContent: "center",
    justifyContent: "center",
    height: "100%",
    
  }
});
