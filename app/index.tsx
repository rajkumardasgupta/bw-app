import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function AuthScreen() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔐 CHECK EXISTING LOGIN */
  useEffect(() => {
    const checkLogin = async () => {
      const userId = await AsyncStorage.getItem("user_id");
      if (userId) {
        router.replace("/(tabs)/dashboard");
      }
    };
    checkLogin();
  }, []);

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);

    const url = isRegister
      ? "https://kolkatacomputermathteacher.in/api/register.php"
      : "https://kolkatacomputermathteacher.in/api/login.php";

    const body = isRegister
      ? `name=${encodeURIComponent(name)}&email=${encodeURIComponent(
          email
        )}&password=${encodeURIComponent(password)}`
      : `email=${encodeURIComponent(email)}&password=${encodeURIComponent(
          password
        )}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await response.json();

      if (data.status === "success") {
        Alert.alert("Success", data.message || "Success");

        /* ✅ STORE USER ID AFTER LOGIN */
        if (!isRegister) {
          await AsyncStorage.setItem("user_id", data.user.id.toString());
          await AsyncStorage.setItem("user_name", data.user.name);

          // ← Store role: 1 = admin, 0 = normal user
          await AsyncStorage.setItem(
            "role",
            data.user.role ? data.user.role.toString() : "0"
          );

          router.replace("/(tabs)/dashboard");
        } else {
          setIsRegister(false);
          setName("");
          setPassword("");
        }
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (err) {
      Alert.alert("Error", "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
  <View style={styles.container}>
    {/* Logo */}
    <Image
      source={{ uri: "https://kolkatacomputermathteacher.in/uploads/locations/bw_logo.png" }}
      style={styles.logo}
      resizeMode="contain"
    />

    <Text style={styles.title}>
      {isRegister ? "Breathe Well Register" : "Breathe Well Login"}
    </Text>

    {isRegister && (
      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
    )}

    <TextInput
      placeholder="Email"
      style={styles.input}
      autoCapitalize="none"
      value={email}
      onChangeText={setEmail}
    />

    <TextInput
      placeholder="Password"
      style={styles.input}
      secureTextEntry
      value={password}
      onChangeText={setPassword}
    />

    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
      <Text style={styles.buttonText}>
        {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => setIsRegister(!isRegister)}
      style={{ marginTop: 20 }}
    >
      <Text style={styles.switchText}>
        {isRegister
          ? "Already have an account? Login"
          : "New user? Register here"}
      </Text>
    </TouchableOpacity>
  </View>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#DC4D01",
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    textAlign: "center",
    color: "#DC4D01",
    fontWeight: "600",
  },
  logo: {
  width: 120,
  height: 120,
  alignSelf: "center",
  marginBottom: 20,
},
});
