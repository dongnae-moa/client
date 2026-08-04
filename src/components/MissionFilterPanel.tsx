import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  difficulties,
  DISTANCE_ANY,
  POINTS_ANY,
  sortOptions,
  TIME_ANY,
  type MissionFilters,
} from "../data/missions";
import { useTheme } from "../theme/ThemeContext";

type RangeSliderProps = {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueText: string;
  onChange: (value: number) => void;
};

function RangeSlider({
  label,
  min,
  max,
  step,
  value,
  valueText,
  onChange,
}: RangeSliderProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue((value - min) / (max - min));

  useEffect(() => {
    progress.value = (value - min) / (max - min);
  }, [max, min, progress, value]);

  const updateFromX = (x: number) => {
    if (trackWidth <= 0) return;
    const nextProgress = Math.max(0, Math.min(1, x / trackWidth));
    const rawValue = min + nextProgress * (max - min);
    const nextValue = Math.max(
      min,
      Math.min(max, Math.round(rawValue / step) * step),
    );
    progress.value = (nextValue - min) / (max - min);
    onChange(nextValue);
  };

  const gesture = useMemo(() => {
    // 세로로 끌면 패널 스크롤이 이기도록 failOffsetY를 둔다.
    const pan = Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-4, 4])
      .failOffsetY([-12, 12])
      .onBegin((event) => updateFromX(event.x))
      .onUpdate((event) => updateFromX(event.x));
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDuration(260)
      .onEnd((event, success) => {
        if (success) updateFromX(event.x);
      });
    return Gesture.Race(pan, tap);
  }, [max, min, onChange, step, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: progress.value * trackWidth,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * Math.max(0, trackWidth - 20) }],
  }));

  const adjust = (direction: number) =>
    onChange(Math.max(min, Math.min(max, value + direction * step)));

  return (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.greenInk }]}>
          {valueText}
        </Text>
      </View>
      <GestureDetector gesture={gesture}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value, text: valueText }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) =>
            adjust(event.nativeEvent.actionName === "increment" ? 1 : -1)
          }
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={styles.sliderTouchArea}
        >
          <View
            style={[styles.sliderTrack, { backgroundColor: colors.surfaceRaised }]}
          >
            <Animated.View
              style={[
                styles.sliderFill,
                { backgroundColor: colors.green },
                fillStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.sliderThumb,
                { backgroundColor: colors.text, borderColor: colors.surface },
                thumbStyle,
              ]}
            />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

// 옵션 타입을 그대로 흘려보내야 난이도처럼 리터럴 유니온인 필터에도 쓸 수 있다.
function ChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.choiceGroup}>
      <Text style={[styles.choiceLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.green : colors.surfaceRaised,
                  borderColor: selected ? colors.green : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? "#17310b" : colors.muted },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type MissionFilterPanelProps = {
  filters: MissionFilters;
  onChange: (patch: Partial<MissionFilters>) => void;
  onReset: () => void;
  onClose: () => void;
  resultCount: number;
  /** 지도를 가리지 않도록 패널이 쓸 수 있는 최대 높이. */
  maxHeight: number;
};

/** 상단바에서 펼쳐지는 필터 패널. 값이 바뀌면 지도·목록에 바로 반영된다. */
export default function MissionFilterPanel({
  filters,
  onChange,
  onReset,
  onClose,
  resultCount,
  maxHeight,
}: MissionFilterPanelProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ScrollView
        style={{ maxHeight }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.panelContent}
      >
        <ChipRow
          label="난이도"
          options={difficulties}
          value={filters.difficulty}
          onChange={(difficulty) => onChange({ difficulty })}
        />
        <RangeSlider
          label="최대 거리"
          min={50}
          max={DISTANCE_ANY}
          step={50}
          value={filters.distance}
          valueText={
            filters.distance === DISTANCE_ANY ? "상관없음" : `${filters.distance}m`
          }
          onChange={(distance) => onChange({ distance })}
        />
        <RangeSlider
          label="최대 시간"
          min={1}
          max={TIME_ANY}
          step={1}
          value={filters.minutes}
          valueText={
            filters.minutes === TIME_ANY ? "상관없음" : `${filters.minutes}분`
          }
          onChange={(minutes) => onChange({ minutes })}
        />
        <RangeSlider
          label="최소 포인트"
          min={1}
          max={POINTS_ANY}
          step={1}
          value={filters.points}
          valueText={
            filters.points === POINTS_ANY ? "상관없음" : `${filters.points}P`
          }
          onChange={(points) => onChange({ points })}
        />
        <ChipRow
          label="정렬"
          options={sortOptions.map((option) => option.label)}
          value={
            sortOptions.find((option) => option.id === filters.sort)?.label ??
            sortOptions[0].label
          }
          onChange={(label) => {
            const next = sortOptions.find((option) => option.label === label);
            if (next) onChange({ sort: next.id });
          }}
        />
      </ScrollView>

      <View style={[styles.panelFooter, { borderTopColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Ionicons name="refresh-outline" size={15} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted }]}>초기화</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.applyButton,
            { backgroundColor: colors.green },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.applyText}>미션 {resultCount}개 보기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  panelContent: { paddingBottom: 14, paddingHorizontal: 15, paddingTop: 4 },
  panelFooter: {
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  resetButton: { alignItems: "center", flexDirection: "row", gap: 4 },
  resetText: { fontFamily: "WantedSansB", fontSize: 11 },
  applyButton: {
    alignItems: "center",
    borderRadius: 999,
    flex: 1,
    paddingVertical: 11,
  },
  applyText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 12 },
  choiceGroup: { marginTop: 14 },
  choiceLabel: { fontFamily: "WantedSansB", fontSize: 12, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: { fontFamily: "WantedSansB", fontSize: 10 },
  sliderGroup: { marginTop: 18 },
  sliderHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: { fontFamily: "WantedSansB", fontSize: 12 },
  sliderValue: { fontFamily: "WantedSansB", fontSize: 12 },
  sliderTouchArea: { height: 30, justifyContent: "center", marginTop: 3 },
  sliderTrack: { borderRadius: 999, height: 5, overflow: "visible" },
  sliderFill: { borderRadius: 999, height: 5 },
  sliderThumb: {
    borderRadius: 999,
    borderWidth: 3,
    height: 20,
    left: 0,
    position: "absolute",
    top: -7.5,
    width: 20,
  },
  pressed: { opacity: 0.72 },
});
