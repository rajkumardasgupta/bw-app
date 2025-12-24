import AsyncStorage from "@react-native-async-storage/async-storage";
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

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  /* 🔹 Load user profile */
  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("user_id");
      if (!id) {
        router.replace("/");
        return;
      }
      setUserId(id);
      fetchProfile(id);
    };
    loadUser();
  }, []);

  const fetchProfile = async (id: string) => {
    try {
      const formData = new FormData();
      formData.append("user_id", id);

      const res = await fetch(
        "https://kolkatacomputermathteacher.in/api/profile_fetch.php",
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (data.status === "success") {
        setName(data.user.name);
        setEmail(data.user.email);
        setPhone(data.user.phone || "");
      } else {
        Alert.alert("Error", data.message || "Failed to load profile");
      }
    } catch {
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 Update profile */
  const updateProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("user_id", String(userId));
      formData.append("name", name);
      formData.append("phone", phone);

      const res = await fetch(
        "https://kolkatacomputermathteacher.in/api/profile_update.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.status === "success") {
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", data.message || "Update failed");
      }
    } catch {
      Alert.alert("Error", "Server error");
    } finally {
      setSaving(false);
    }
  };

  /* 🔹 Logout */
  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/");
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#DC4D01" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
      source={{
        uri: "https://kolkatacomputermathteacher.in/uploads/locations/bw_logo.png",
      }}
      style={styles.topImage}
      resizeMode="contain"
    />
      <Text style={styles.title}>Your Profile</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name"
      />

      <TextInput
        style={[styles.input, styles.readonly]}
        value={email}
        editable={false}
        placeholder="Email"
      />

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone"
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={updateProfile}>
        <Text style={styles.btnText}>
          {saving ? "Saving..." : "Update Profile"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>

        <TouchableOpacity
        style={styles.infoBtn}
        onPress={() => router.push("/instructions")}
        >
        <Text style={styles.infoBtnText}>📘 How to Use This App</Text>
        </TouchableOpacity>

      {/* 🔒 Copyright */}
      <Text style={styles.copyright}>
        © {new Date().getFullYear()} Breathe Well
      </Text>
    </ScrollView>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    marginTop: 20,
    //justifyContent: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  readonly: {
    backgroundColor: "#f2f2f2",
  },
  saveBtn: {
    backgroundColor: "#DC4D01",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  logoutBtn: {
    backgroundColor: "#b71c1c",
    padding: 14,
    borderRadius: 8,
    marginTop: 15,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  copyright: {
    textAlign: "center",
    marginTop: 30,
    color: "#888",
    fontSize: 13,
  },
  infoBtn: {
  backgroundColor: "#DC4D01",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 16,
  alignItems: "center",
},
infoBtnText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},
topImage: {
  width: "100%",
  height: 120,
  marginBottom: 20,
},

});
