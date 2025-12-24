import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ACTIVITIES = [
  { key: "tree_plantation", label: "🌳 Tree Plantation" },
  { key: "tree_maintenance", label: "🌱 Tree Maintenance" },
  { key: "air_pollution", label: "🌫️ Air / Soil Pollution" },
  { key: "save_water", label: "💧 Save Water" },
];

export default function Dashboard() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null); 
  const [trees, setTrees] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<any>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const [loadingImage, setLoadingImage] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // TEMP – replace with AsyncStorage user id
  //const userId = 1;
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id");
      const name = await AsyncStorage.getItem("user_name");

      if (!id) {
        router.replace("/");
        return;
      }

      setUserId(id);
      setUserName(name);
    };

    loadUser();
  }, []);

  /* ---------------- LOCATION ---------------- */
  const getLocation = async () => {
  setFetchingLocation(true);

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Location permission is needed");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    setLatitude(loc.coords.latitude);
    setLongitude(loc.coords.longitude);
  } catch (error) {
    Alert.alert("Error", "Unable to fetch location");
  } finally {
    setFetchingLocation(false);
  }
};


  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = async () => {
  setLoadingImage(true); // start spinner
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const original = result.assets[0];

      // Compress and resize
      const compressed = await ImageManipulator.manipulateAsync(
        original.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setImage(compressed);
    }
  } catch (err) {
    Alert.alert("Error", "Image selection failed");
  } finally {
    setLoadingImage(false); // stop spinner
  }
};


  /* ---------------- ACTIVITY TOGGLE ---------------- */
  const toggleActivity = (key: string) => {
    setSelectedActivities((prev) =>
      prev.includes(key)
        ? prev.filter((i) => i !== key)
        : [...prev, key]
    );
  };

  /* ---------------- SUBMIT ---------------- */
  const submitData = async () => {
    if (!latitude || !longitude || selectedActivities.length === 0) {
      Alert.alert("Error", "Location and activity are required");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("user_id", String(userId));
    formData.append("latitude", String(latitude));
    formData.append("longitude", String(longitude));
    formData.append("number_of_trees", trees || "0");
    formData.append("notes", notes);
    formData.append(
      "activity_types",
      selectedActivities.join(",")
    );

    if (image) {
      const fileType = image.uri.endsWith(".png") ? "image/png" : "image/jpeg";
      formData.append("image", {
        uri: image.uri,
        name: "location.jpg",
        type: fileType,
      } as any);
    }

    try {
      const response = await fetch(
        "https://kolkatacomputermathteacher.in/api/store.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        Alert.alert("Success", "Data saved successfully 🌱");
        setTrees("");
        setNotes("");
        setImage(null);
        setSelectedActivities([]);
      } else {
        Alert.alert("Error", data.message || "Failed to save");
      }
    } catch (err) {
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Enter Potential Site Details</Text>

      {/* Location */}
      <TouchableOpacity
  style={[
    styles.greenBtn,
    fetchingLocation && { opacity: 0.7 },
  ]}
  onPress={getLocation}
  disabled={fetchingLocation}
>
  {fetchingLocation ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.btnText}>
      Click Here To Fetch Your Current Location
    </Text>
  )}
</TouchableOpacity>


      {latitude && longitude && (
        <Text style={styles.coords}>
          📍 Your Current Location is: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      )}

      {/* Activities */}
      <Text style={styles.sectionTitle}>Select Activity Type</Text>

      <View style={styles.activityGrid}>
        {ACTIVITIES.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[
              styles.activityBtn,
              selectedActivities.includes(a.key) && styles.activeActivity,
            ]}
            onPress={() => toggleActivity(a.key)}
          >
            <Text style={styles.activityText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>


      {/* Trees */}
      <TextInput
        placeholder="Number of trees can be planted (if applicable)"
        keyboardType="numeric"
        style={styles.input}
        value={trees}
        onChangeText={setTrees}
      />

      {/* Notes */}
      <TextInput
        placeholder="Notes (Additional Details like location Address / Area details / types of plant species that can be planted / person to contact in there etc.)"
        style={[styles.input, { height: 80 }]}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      {/* Image */}
      <TouchableOpacity
        style={styles.grayBtn}
        onPress={pickImage}
        disabled={loadingImage}
      >
        {loadingImage ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Attach Image</Text>
        )}
      </TouchableOpacity>


      {image && (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      )}

      {/* Submit */}
      <TouchableOpacity
      style={[styles.submitBtn, loading && { opacity: 0.7 }]}
      onPress={submitData}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#330202ff" />
      ) : (
        <Text style={styles.btnText}>Save Data</Text>
      )}
    </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  greenBtn: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  grayBtn: {
    backgroundColor: "#555",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#DC4D01",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  coords: {
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  activityGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  },

  activityBtn: {
    width: "48%",   // 👈 2 columns
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },

  activeActivity: {
    backgroundColor: "#DC4D01",
    borderColor: "#DC4D01",
  },

  activityText: {
    fontWeight: "600",
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
});
