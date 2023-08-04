
import React from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import { LeafletView } from "react-native-leaflet";


const DEFAULT_COORDINATE = {
  lat: 37.78825,
  lng: -122.4324,
};


const MapDisplay = () => {
  return (
    <View>
      <SafeAreaView style={styles.root}>
        <LeafletView
          mapMarkers={[
            {
              position: DEFAULT_COORDINATE,
              icon: "📍",
              size: [32, 32],
            },
          ]}
          mapCenterPosition={DEFAULT_COORDINATE}
        />
      </SafeAreaView>
    </View>
  );
};

export default MapDisplay;


const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});