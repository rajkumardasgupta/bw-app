import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

type LocationItem = {
  id: number;
  user_id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  number_of_trees: number;
  notes: string;
  activity_types: string;
  image?: string | null;
  post_image?: string | null;
  status: string; // "pending" or "done"
  created_at: string;
  done_date?: string | null;
};

const MapScreen = () => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<number>(0); // 1 = admin, 0 = normal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadUserAndLocations = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (!id) return;
      setUserId(id);
      fetchLocations(id);
    };
    loadUserAndLocations();
  }, []);

  const fetchLocations = async (user_id: string) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user_id);

      const res = await fetch("https://kolkatacomputermathteacher.in/api/map_fetch.php", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.status === "success") {
        setLocations(data.locations);
        setRole(data.role ?? 0);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch locations");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  const onMarkerClick = (id: number) => {
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setSelectedLocation(loc);
      setModalVisible(true);
    }
  };

  const refreshMap = () => {
    if (webviewRef.current) webviewRef.current.reload();
    if (userId) fetchLocations(userId);
  };

  const locateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });

    if (webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        map.setView([${loc.coords.latitude}, ${loc.coords.longitude}], 16);

        if (window.userMarker) { map.removeLayer(window.userMarker); }

        window.userMarker = L.marker([${loc.coords.latitude}, ${loc.coords.longitude}], {
          icon: L.icon({
            iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            iconSize: [32,32]
          })
        }).addTo(map).bindPopup('You are here').openPopup();
        true;
      `);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#DC4D01" />
      </View>
    );
  }

  // Prepare map HTML
  const mapHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      </head>
      <body style="margin:0;padding:0;">
        <div id="map" style="width:100%;height:100vh;"></div>
        <script>
          const map = L.map('map');
          const kolkataBounds = L.latLngBounds([22.45,88.20],[22.75,88.55]);
          map.fitBounds(kolkataBounds);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          const locations = ${JSON.stringify(locations)};

          locations.forEach(loc => {
            const iconUrl = loc.status === 'done' ? 
              'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
              'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';

            const marker = L.marker([loc.latitude, loc.longitude], {
              icon: L.icon({ iconUrl, iconSize: [32,32] })
            }).addTo(map);

            marker.on('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerClick', id: loc.id }));
            });
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === 1 ? "All Locations (Admin)" : "My Locations"}
      </Text>

      <WebView
        ref={webviewRef}
        originWhitelist={["*"]}
        source={{ html: mapHTML }}
        javaScriptEnabled={true}
        onMessage={(event) => {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === "markerClick") onMarkerClick(msg.id);
        }}
      />

      {selectedLocation && (
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView style={{ flexGrow: 0 }}>
                <Text style={styles.modalTitle}>Location Details</Text>
                <Text>Task ID: {selectedLocation.id}</Text>
                <Text>User: {selectedLocation.user_name}</Text>
                <Text>Trees: {selectedLocation.number_of_trees}</Text>
                <Text>Activities: {selectedLocation.activity_types}</Text>
                <Text>Notes: {selectedLocation.notes || "N/A"}</Text>
                <Text>Status: {selectedLocation.status}</Text>
                <Text>Created: {selectedLocation.created_at}</Text>
                {selectedLocation.done_date && <Text>Done: {selectedLocation.done_date}</Text>}

                {selectedLocation.image && (
                  <Image
                    source={{
                      uri: selectedLocation.image.startsWith("http")
                        ? selectedLocation.image
                        : "https://kolkatacomputermathteacher.in/" + selectedLocation.image,
                    }}
                    style={{ width: "100%", height: 200, marginTop: 10, borderRadius: 8 }}
                  />
                )}

                {selectedLocation.post_image && (
                  <Image
                    source={{
                      uri: selectedLocation.post_image.startsWith("http")
                        ? selectedLocation.post_image
                        : "https://kolkatacomputermathteacher.in/" + selectedLocation.post_image,
                    }}
                    style={{ width: "100%", height: 200, marginTop: 10, borderRadius: 8 }}
                  />
                )}
              </ScrollView>

              <View style={{ flexDirection: "row", marginTop: 15, justifyContent: "space-between" }}>
                <TouchableOpacity
                  style={[styles.bottomBtn, { backgroundColor: "#4285F4", flex: 1, marginRight: 6 }]}
                  onPress={() =>
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`)
                  }
                >
                  <Text style={styles.btnText}>Open in Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bottomBtn, { backgroundColor: "#DC4D01", flex: 1, marginLeft: 6 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom buttons */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity style={styles.locateBtn} onPress={locateMe}>
          <Text style={styles.btnText}>Locate Me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshBtn} onPress={refreshMap}>
          <Text style={styles.btnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 8, marginTop: 30 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "90%", backgroundColor: "#fff", borderRadius: 10, padding: 15, maxHeight: "80%" },
  modalTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  bottomBtns: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  locateBtn: { flex: 1, marginRight: 6, padding: 12, borderRadius: 8, backgroundColor: "#2e7d32" },
  refreshBtn: { flex: 1, marginLeft: 6, padding: 12, borderRadius: 8, backgroundColor: "#DC4D01" },
  bottomBtn: {},
});
