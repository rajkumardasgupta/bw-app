import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function InstructionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back button */}
      

      <Text style={styles.title}>How to Use Breathe Well App</Text>

      <Text style={styles.step}>
  1️⃣ Open 'Home' tab to submit new activities
  {"\n"}- 'Home' tab খুলে নতুন কার্যক্রম জমা দিন

  {"\n"}2️⃣ Get current location by tapping "Click Here To Fetch Your Current Location"
  {"\n"}- “Click Here To Fetch Your Current Location” বাটনে চাপ দিয়ে আপনার বর্তমান অবস্থান নিন

  {"\n"}3️⃣ Select activity types
  {"\n"}- কার্যক্রমের ধরন নির্বাচন করুন

  {"\n"}4️⃣ Enter number of trees (if applicable)
  {"\n"}- গাছ লাগানোর সংখ্যা লিখুন (যদি প্রযোজ্য হয়)

  {"\n"}5️⃣ Add notes (optional)
  {"\n"}- অতিরিক্ত তথ্য বা নোট যোগ করুন (ঐচ্ছিক)

  {"\n"}6️⃣ Attach an image (optional)
  {"\n"}- একটি ছবি যুক্ত করুন (ঐচ্ছিক)

  {"\n"}7️⃣ View submitted locations in:
  
  {"\n"}• Explore tab (List View)
  {"\n"}• Map tab (Map View)
  {"\n"}- আপনার জমা দেওয়া অবস্থানগুলো দেখুন:
  {"\n"}• Explore ট্যাব (লিস্ট আকারে)
  {"\n"}• Map ট্যাব (মানচিত্রে)

  <Text style={styles.step}>
  {"\n"}8️⃣ From the Explore or Map tab, you can open any submitted location. 
  After completing the activity, you can upload a *post image* and mark it as{" "}
  <Text style={{ fontWeight: "bold" }}>Done</Text>.  

  {"\n"}You can also delete any wrong or unwanted entry. A confirmation prompt will appear before deletion.  

  {"\n"}- Explore বা Map ট্যাব থেকে যেকোনো জমা দেওয়া স্থান খুলে কার্য সম্পন্ন হলে *post image* আপলোড করে{" "}
  <Text style={{ fontWeight: "bold" }}>Done</Text>
  {" "}চিহ্নিত করতে পারেন।  

  {"\n"}- কোন ভুল বা অপ্রয়োজনীয় এন্ট্রি মুছে ফেলতে চাইলে{" "}
  <Text style={{ fontWeight: "bold" }}>Delete</Text>
  {" "}বাটনে চাপুন। ডিলেট করার আগে একটি নিশ্চিতকরণ (confirmation) পপআপ দেখানো হবে।
</Text>



  {"\n"}9️⃣ Edit your profile details (name & phone number) in the Profile tab
  {"\n"}-  Profile ট্যাবে গিয়ে আপনার নাম ও ফোন নম্বর সম্পাদনা করতে পারেন
</Text>



      <Text style={styles.footer}>
        🌱 Thank you for contributing to Breathe Well
      </Text>
      <TouchableOpacity
              style={styles.infoBtn}
              onPress={() => router.back()}
              >
              <Text style={styles.infoBtnText}>← Back</Text>
              </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  back: {
    color: "#DC4D01",
    fontSize: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  step: {
  fontSize: 16,
  marginBottom: 14,
  lineHeight: 24,
},

  footer: {
    marginTop: 30,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
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
});
