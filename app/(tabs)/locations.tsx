import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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

type LocationItem = {
  id: number;
  user_name: string;
  latitude: number;
  longitude: number;
  number_of_trees: number;
  notes: string;
  activity_types: string;
  image?: string;
  post_image?: string;
  status: string;
  created_at: string;
  done_date?: string | null;
};

export default function Locations() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState<number>(0);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user_id = await AsyncStorage.getItem("user_id");
    if (!user_id) return;

    try {
      const formData = new FormData();
      formData.append("user_id", user_id);

      const res = await fetch(
        "https://kolkatacomputermathteacher.in/api/fetch_all_locations.php",
        { method: "POST", body: formData }
      );

      const json = await res.json();

      if (json.status === "success") {
        setRole(json.role);
        setLocations(json.locations);
      }
    } catch {
      Alert.alert("Error", "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- ADMIN: UPLOAD POST IMAGE ---------- */
  const uploadPostImage = async (locationId: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    try {
      setUploading(true);

      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fd = new FormData();
      fd.append("location_id", String(locationId));
      fd.append("post_image", {
        uri: manipulated.uri,
        name: "post.jpg",
        type: "image/jpeg",
      } as any);

      const res = await fetch(
        "https://kolkatacomputermathteacher.in/api/upload_post_image.php",
        { method: "POST", body: fd }
      );

      const json = await res.json();

      if (json.status === "success") {
        Alert.alert("Success", "Marked as Done");
        loadData();
      } else {
        Alert.alert("Error", json.message);
      }
    } catch {
      Alert.alert("Error", "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---------- ADMIN: DELETE ---------- */
  const deleteLocation = (id: number) => {
    Alert.alert("Confirm", "Delete this entry?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const fd = new FormData();
          fd.append("location_id", String(id));

          await fetch(
            "https://kolkatacomputermathteacher.in/api/delete_location.php",
            { method: "POST", body: fd }
          );

          setLocations((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  const img = (path?: string) =>
    path?.startsWith("http")
      ? path
      : "https://kolkatacomputermathteacher.in/" + path;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#DC4D01" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Locations</Text>

      {/* Refresh Button for All Users */}
      <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#DC4D01" />
        </View>
      )}

      <ScrollView>
        {locations.map((loc) => (
          <View key={loc.id} style={styles.card}>
            <Text style={styles.taskId}>Task ID: {loc.id}</Text>
            <Text style={styles.user}>By: {loc.user_name}</Text>

            <View style={styles.imageRow}>
              {loc.image && (
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => {
                    setModalImageUri(img(loc.image)!);
                    setImageModalVisible(true);
                  }}
                >
                  <Image source={{ uri: img(loc.image) }} style={styles.img} />
                  <Text style={styles.imgLabel}>Before</Text>
                </TouchableOpacity>
              )}

              {loc.post_image && (
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => {
                    setModalImageUri(img(loc.post_image)!);
                    setImageModalVisible(true);
                  }}
                >
                  <Image
                    source={{ uri: img(loc.post_image) }}
                    style={styles.img}
                  />
                  <Text style={styles.imgLabel}>After</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text>🌳 Trees: {loc.number_of_trees}</Text>
            <Text>📝 {loc.activity_types}</Text>
            <Text>📝 {loc.notes}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
                  )
                }
              >
                <Text style={styles.mapLink}>Open in Google Maps</Text>
              </TouchableOpacity>

              {role === 1 && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteLocation(loc.id)}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.row}>
              <Text style={styles.date}>Created: {loc.created_at}</Text>
              {loc.done_date && (
                <Text style={styles.date}>Done: {loc.done_date}</Text>
              )}
            </View>

            {role === 1 && !loc.post_image && (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadPostImage(loc.id)}
              >
                <Text style={styles.uploadText}>
                  Upload After Image (Mark Done)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Image
              source={{ uri: modalImageUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#f9f9f9", marginTop: 15 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },

  refreshBtn: { backgroundColor: "#2e7d32", padding: 8, borderRadius: 6, alignSelf: "center", marginBottom: 10 },
  refreshText: { color: "#fff", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  taskId: { fontWeight: "bold", fontSize: 13 },
  user: { fontSize: 12, color: "#555", marginBottom: 4 },

  imageRow: { flexDirection: "row", gap: 8, marginVertical: 6 },
  imageContainer: { flex: 1 },
  img: { width: "100%", height: 120, borderRadius: 8 },
  imgLabel: { textAlign: "center", fontSize: 11 },

  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  mapLink: { color: "#1E88E5", fontSize: 12, textDecorationLine: "underline" },

  deleteBtn: {
    backgroundColor: "#b71c1c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  date: { fontSize: 11, color: "#555" },

  uploadBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#DC4D01",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  uploadText: { color: "#DC4D01", fontSize: 12, fontWeight: "600" },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },
  fullImage: { width: "100%", height: 300 },
  closeBtn: {
    marginTop: 10,
    backgroundColor: "#DC4D01",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
