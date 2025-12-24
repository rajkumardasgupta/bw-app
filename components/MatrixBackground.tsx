import { useEffect, useRef } from "react";
import { Animated, Dimensions, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

const CHARS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@";

function randomChar() {
  return CHARS.charAt(Math.floor(Math.random() * CHARS.length));
}

export default function MatrixBackground() {
  const columns = Math.floor(width / 20);
  const drops = useRef(
    Array(columns)
      .fill(0)
      .map(() => new Animated.Value(Math.random() * height))
  ).current;

  useEffect(() => {
    const intervals = drops.map((drop) =>
      setInterval(() => {
        Animated.timing(drop, {
          toValue: height,
          duration: 2000 + Math.random() * 30,
          useNativeDriver: true,
        }).start(() => {
          drop.setValue(-height);
        });
      }, 1000 + Math.random() * 2000)
    );

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width,
        height,
        backgroundColor: "black",
      }}
    >
      {drops.map((drop, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: i * 20,
            transform: [{ translateY: drop }],
          }}
        >
          {Array.from({ length: 20 }).map((_, j) => (
            <Text
              key={j}
              style={{
                color: "#00ff66",
                fontSize: 14,
                opacity: 0.6,
                lineHeight: 18,
              }}
            >
              {randomChar()}
            </Text>
          ))}
        </Animated.View>
      ))}
    </View>
  );
}
