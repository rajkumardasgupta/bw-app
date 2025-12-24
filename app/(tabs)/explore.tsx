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


export default function Explore() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "done">("pending");
  const [uploading, setUploading] = useState(false);
  // Image modal
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const id = await AsyncStorage.getItem("user_id");
    if (!id) return;
    setUserId(id);
    fetchLocations(id);
  };
  const refreshLocations = async () => {
  if (!userId) return;
  fetchLocations(userId);
};

  const fetchLocations = async (user_id: string) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("user_id", user_id);

      const res = await fetch(
        "https://kolkatacomputermathteacher.in/api/fetch.php",
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (data.status === "success") {
        setLocations(data.locations);
      }
    } catch {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UPLOAD POST IMAGE ---------- */
  const uploadPostImage = async (locationId: number) => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission required", "Gallery access needed");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled) return;

  try {
    setUploading(true);  // ✅ start loader

    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append("location_id", String(locationId));
    formData.append("post_image", {
      uri: manipulated.uri,
      name: "post.jpg",
      type: "image/jpeg",
    } as any);

    const res = await fetch(
      "https://kolkatacomputermathteacher.in/api/upload_post_image.php",
      { method: "POST", body: formData }
    );

    const data = await res.json();

    if (data.status === "success") {
      Alert.alert("Success", "Post image uploaded");
      fetchLocations(userId!);
    } else {
      Alert.alert("Error", data.message || "Upload failed");
    }
  } catch (err) {
    console.log(err);
    Alert.alert("Error", "Image processing failed");
  } finally {
    setUploading(false); // ✅ stop loader
  }
};



  /* ---------- DELETE ---------- */
  const deleteLocation = (id: number) => {
    Alert.alert("Confirm", "Delete this entry?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const formData = new FormData();
          formData.append("location_id", String(id));

          await fetch(
            "https://kolkatacomputermathteacher.in/api/delete_location.php",
            { method: "POST", body: formData }
          );

          setLocations((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#DC4D01" />
      </View>
    );
  }

  const filtered = locations.filter(
    (l) => l.status?.toLowerCase() === filter
  );

  const img = (path?: string) =>
    path?.startsWith("http")
      ? path
      : "https://kolkatacomputermathteacher.in/" + path;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Locations</Text>
      {uploading && (
  <View style={styles.uploadingOverlay}>
    <ActivityIndicator size="large" color="#DC4D01" />
  </View>
)}

      {/* Filter */}
      <View style={styles.filterRow}>
  <View style={{ flexDirection: "row" }}>
    {["pending", "done"].map((f) => (
      <TouchableOpacity
        key={f}
        style={[
          styles.filterBtn,
          filter === f && styles.activeFilter,
        ]}
        onPress={() => setFilter(f as any)}
      >
        <Text
          style={[
            styles.filterText,
            filter === f && styles.activeFilterText,
          ]}
        >
          {f.toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  <TouchableOpacity style={styles.refreshBtn} onPress={refreshLocations}>
    <Text style={styles.refreshText}>Refresh</Text>
  </TouchableOpacity>
</View>


      <ScrollView>
        {filtered.length === 0 && (
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            No {filter} entries
          </Text>
        )}

        {filtered.map((loc) => (
          <View key={loc.id} style={styles.card}>
            <Text style={styles.taskId}>Task ID: {loc.id}</Text>

            {/* Images row */}
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

  {loc.post_image ? (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => {
        setModalImageUri(img(loc.post_image)!);
        setImageModalVisible(true);
      }}
    >
      <Image source={{ uri: img(loc.post_image) }} style={styles.img} />
      <Text style={styles.imgLabel}>After</Text>
    </TouchableOpacity>
  ) : (
    loc.status === "pending" && (
      <TouchableOpacity
        style={[styles.imageContainer, styles.uploadBtn]}
        onPress={() => uploadPostImage(loc.id)}
      >
        <Text style={styles.uploadText}>Upload After Image Here To Mark As Done</Text>
      </TouchableOpacity>
    )
  )}
</View>

            <Text>🌳 No. of Trees: {loc.number_of_trees}</Text>
            <Text>📝 Note: {loc.notes || "No notes"}</Text>
            <Text>📝 Activities: {loc.activity_types }</Text>

            {/* Actions Row */}
<View style={styles.row}>
  <TouchableOpacity onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`)}>
    <Text style={styles.mapLink}>Open in Google Maps</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteLocation(loc.id)}>
    <Text style={styles.btnText}>Delete</Text>
  </TouchableOpacity>
</View>
            <View style={styles.row}>
  <Text style={styles.dateText}>Created: {loc.created_at}</Text>
  {loc.done_date && <Text style={styles.dateText}>Done: {loc.done_date}</Text>}
</View>

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

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  uploadingOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.3)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
},

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
dateText: { fontSize: 11, color: "#555" },
mapLink: { color: "#1E88E5", fontSize: 12, textDecorationLine: "underline" },
deleteBtn: { backgroundColor: "#b71c1c", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
btnText: { color: "#fff", fontWeight: "600", fontSize: 11 },

  dateRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6,
},

  imageRow: {
  flexDirection: "row",
  marginBottom: 8,
},
imageContainer: {
  flex: 1,              // take equal width
  marginRight: 8,       // space between images
},
img: {
  width: "100%",
  height: 120,
  borderRadius: 8,
},
imgLabel: {
  textAlign: "center",
  fontSize: 12,
  marginTop: 4,
},
uploadBtn: {
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#DC4D01",
  borderRadius: 8,
  height: 120,
},

  container: { flex: 1, padding: 12, backgroundColor: "#f9f9f9", marginTop: 15 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },

  filterRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  filterBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 5,
  },
  activeFilter: { backgroundColor: "#DC4D01", borderColor: "#DC4D01" },
  filterText: { fontWeight: "600" },
  activeFilterText: { color: "#fff" },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  taskId: { fontWeight: "bold", marginBottom: 6 },

  uploadText: { color: "#DC4D01", fontWeight: "600", textAlign: "center" },


  btnRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
 

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
  refreshBtn: {
  backgroundColor: "#2e7d32",
  paddingVertical: 10,
  paddingHorizontal: 14,
  borderRadius: 8,
  marginLeft: 8,
},

refreshText: {
  color: "#fff",
  fontWeight: "600",
},

});
