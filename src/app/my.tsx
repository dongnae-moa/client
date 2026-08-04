import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import FloatingNavBar from "../components/FloatingNavBar";
export default function Index() {
  return (
    <View style={styles.container}>
      <ScrollView>
        <Image
          style={styles.image}
          source={require("@/assets/images/로고임.png")}
        />
        <View>
          <Text style={styles.topTitleText}>추천 미션</Text>
          <View style={styles.topCard}>
            <View style={styles.topCardHeader}>
              <Text style={styles.topCardText}>지쿠 세우기</Text>
              <Text style={styles.topCardText}>50</Text>
            </View>
            <Text style={styles.topCardContent}>20m · 3분</Text>
            <View style={styles.topCardButton}>
              <Text style={styles.topCardButtonText}>미션하기</Text>
            </View>
          </View>
          <Text style={styles.titleText}>미션들</Text>
          <View style={styles.card}>
            <Image
              style={styles.cardImage}
              source={require("@/assets/images/omg.png")}
            />
            <View style={styles.cardTexts}>
              <Text style={styles.cardTitleText}>진상 퇴치하기</Text>
              <Text style={styles.cardTitleText}>60</Text>
              <Text style={styles.cardContentText}>20m · 약 3분</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Image
              style={styles.cardImage}
              source={require("@/assets/images/omg.png")}
            />
            <View style={styles.cardTexts}>
              <Text style={styles.cardTitleText}>지쿠 세우기</Text>
              <Text style={styles.cardTitleText}>60</Text>
              <Text style={styles.cardContentText}>20m · 약 3분</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Image
              style={styles.cardImage}
              source={require("@/assets/images/omg.png")}
            />
            <View style={styles.cardTexts}>
              <Text style={styles.cardTitleText}>지쿠 세우기</Text>
              <Text style={styles.cardTitleText}>60</Text>
              <Text style={styles.cardContentText}>20m · 약 3분</Text>
            </View>
          </View>
        </View>
        <View style={styles.moreMissionBtn}>
          <Text style={styles.moreMissionText}>미션 더보기</Text>
        </View>
      </ScrollView>
      <FloatingNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: 174,
    height: 51,
    marginTop: 48,
    alignSelf: "center",
  },
  cardImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  cardTexts: { alignItems: "flex-end" },
  cardTitleText: {
    fontFamily: "WantedSansB",
    fontSize: 24,
  },
  cardContentText: {
    fontFamily: "WantedSansR",
    fontSize: 20,
  },
  topTitleText: {
    fontFamily: "WantedSansB",
    fontSize: 24,
    marginLeft: 20,
    marginTop: 8,
  },
  titleText: {
    fontFamily: "WantedSansB",
    fontSize: 24,
    marginLeft: 20,
    marginTop: 28,
  },
  card: {
    marginTop: 8,
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 20,
    marginLeft: 20,
    marginRight: 20,
    padding: 12,
    paddingRight: 18,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topCard: {
    marginTop: 8,
    borderColor: "#d0d0d0",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 20,
    marginLeft: 20,
    marginRight: 20,
    padding: 18,
  },
  topCardHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topCardText: {
    fontFamily: "WantedSansB",
    fontSize: 24,
  },
  topCardContent: {
    fontFamily: "WantedSansR",
    fontSize: 20,
    marginTop: 4,
  },
  topCardButton: {
    backgroundColor: "#101010",
    marginTop: 16,
    borderRadius: 10,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  topCardButtonText: {
    color: "white",
    fontFamily: "WantedSansB",
    fontSize: 20,
  },
  moreMissionBtn: {
    backgroundColor: "black",
    padding: 8,
    margin: 20,
    marginTop: 8,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 100,
  },
  moreMissionText: { fontFamily: "WantedSansR", fontSize: 20, color: "white" },
});
