import React, { useRef, useState } from "react";
import {
  Text,
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get("window");

const PAGES = [
  {
    key: "1",
    image: require("../../assets/images/introman1.png"),
    title: "Món ngon trong một chạm",
    text: "Chọn món bạn thích chỉ trong vài giây, vào app là có ngay đồ ăn bạn muốn",
  },
  {
    key: "2",
    image: require("../../assets/images/introman2.png"),
    title: "Hàng ngàn quán ngon",
    text: "Khám phá thực đơn đa dạng từ quán vỉa hè đến nhà hàng sang trọng",
  },
  {
    key: "3",
    image: require("../../assets/images/introman3.png"),
    title: "Món ngon từ đầu bếp bạn chọn",
    text: "Mỗi món ăn đều được chuẩn bị kỹ lưỡng, đảm bảo hương vị tuyệt vời nhất khi đến tay bạn",
  },
  {
    key: "4",
    image: require("../../assets/images/introman4.png"),
    title: "Giao hàng nhanh chóng",
    text: "Đơn hàng của bạn được xử lý ngay lập tức và giao bởi tài xế gần nhất, đảm bảo món đến nhanh và vẫn còn nóng hổi",
  },
];

export default function IntroScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<any> | null>(null);
  const navigation = useNavigation();

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(newIndex);
  };

  const goNext = () => {
    if (activeIndex === PAGES.length - 1) {
      navigation.navigate('Login' as never);
      return;
    }

    const next = Math.min(activeIndex + 1, PAGES.length - 1);
    if (listRef.current) {
      listRef.current.scrollToIndex({ index: next, animated: true });
    }
    setActiveIndex(next);
  };

  const renderPage = ({ item }: { item: typeof PAGES[number] }) => (
    <View style={[styles.pageContainer, { width }]}> 
      <View style={styles.top}>
        <Image source={item.image} style={styles.image} />
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        renderItem={renderPage}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>{activeIndex === PAGES.length - 1 ? "Bắt đầu" : "Tiếp tục"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} style={styles.skipWrap}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  pageContainer: {
    flex: 1,
  },

  top: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 150,
  },

  bottom: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#152d35ff",
    marginTop: 50,
  },

  text: {
    fontSize: 18,
    textAlign: "center",
    opacity: 0.8,
    color: "#394663ff",
    fontWeight: "500",
    paddingHorizontal: 20,
    marginTop: 20,
  },

  image: {
    width: "90%",
    height: undefined,
    aspectRatio: 1,
    resizeMode: "contain",
  },

  footer: {
    alignItems: "center",
    marginBottom: 50,
  },

  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#e9cfaeff",
    marginHorizontal: 6,
  },

  activeDot: {
    width: 14,
    height: 14,
    borderRadius: 14,
    backgroundColor: "#d38612ff",
  },

  button: {
    backgroundColor: "#d38612ff",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: "center",
    width: '90%',
    marginTop: 20,
  },

  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  skipWrap: { marginTop: 15 },
  skipText: { color: '#394663ff', opacity: 0.8, fontSize: 18},
});
    
