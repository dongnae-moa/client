import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import { ScreenSurface, SurfaceCard } from "../components/ScreenSurface";
import { useTheme } from "../theme/ThemeContext";

type CommunityTab = "ALL" | "NEWS" | "VERIFY" | "STORY";
type BragType = "NONE" | "POINT" | "BADGE" | "RECRUIT";

type CommunityComment = {
  id: string;
  author: string;
  body: string;
};

type CommunityPost = {
  id: string;
  category: Exclude<CommunityTab, "ALL">;
  title: string;
  body: string;
  author: string;
  neighborhood: string;
  timeLabel: string;
  image?: number | string | null;
  system?: boolean;
  rule?: string;
  verified?: boolean;
  brag?: BragType;
  likes: number;
  liked: boolean;
  comments: CommunityComment[];
};

const STORAGE_KEY = "dongnaemoa.community-feed.v2";

const SYSTEM_NEWS: CommunityPost = {
  id: "system-weekly-24",
  category: "NEWS",
  title: "이번 주 24번째 동네 문제가 해결됐어요",
  body: "서초2동 주민 83명이 함께 만든 변화예요. 해결 미션 25건까지 하나만 남았어요.",
  author: "동네모아 시스템",
  neighborhood: "서초2동",
  timeLabel: "방금",
  image: require("@/assets/images/missions/bench-trash.png"),
  system: true,
  rule: "해결된 문제 24건 달성 시 자동 게시",
  likes: 41,
  liked: false,
  comments: [{ id: "system-comment-1", author: "산책하는곰", body: "다 같이 만든 숫자라 더 좋네요!" }],
};

const SEED_POSTS: CommunityPost[] = [
  SYSTEM_NEWS,
  {
    id: "verify-tactile",
    category: "VERIFY",
    title: "점자블록 위 방해물을 정리했어요",
    body: "큰 물건은 건드리지 않고 이동 가능한 상자만 블록 밖으로 옮겼어요. 이웃 검토도 완료됐습니다.",
    author: "동네지킴이",
    neighborhood: "서초2동",
    timeLabel: "18분 전",
    image: require("@/assets/images/missions/tactile-block.png"),
    verified: true,
    likes: 32,
    liked: false,
    comments: [{ id: "verify-comment-1", author: "무장애길찾기", body: "안전하게 정리해주셔서 감사해요." }],
  },
  {
    id: "story-point",
    category: "STORY",
    title: "드디어 1,250P 모았어요",
    body: "퇴근길 3분 미션만 꾸준히 했는데 스타벅스 혜택이 눈앞이에요. 오늘도 하나 더 해보려고요.",
    author: "골목산책러",
    neighborhood: "서초2동",
    timeLabel: "42분 전",
    brag: "POINT",
    likes: 18,
    liked: false,
    comments: [],
  },
  {
    id: "story-badge",
    category: "STORY",
    title: "환경 지킴이 배지를 받았어요",
    body: "벤치 주변 정리 미션 5개를 완료해서 새 배지를 받았어요. 다음 목표는 Community Hero예요.",
    author: "하천러너",
    neighborhood: "반포1동",
    timeLabel: "1시간 전",
    brag: "BADGE",
    likes: 27,
    liked: false,
    comments: [],
  },
  {
    id: "story-recruit",
    category: "STORY",
    title: "오늘 저녁 공원 안내판 확인하실 분?",
    body: "혼자 가도 되지만 근처 계신 분과 같이 확인하면 좋을 것 같아요. 오후 7시에 입구에서 만나요.",
    author: "공원한바퀴",
    neighborhood: "서초2동",
    timeLabel: "2시간 전",
    image: require("@/assets/images/missions/park-sign.png"),
    brag: "RECRUIT",
    likes: 9,
    liked: false,
    comments: [{ id: "recruit-comment-1", author: "초록벤치", body: "저 참여할게요!" }],
  },
];

const tabs: { id: CommunityTab; label: string }[] = [
  { id: "ALL", label: "전체" },
  { id: "NEWS", label: "소식" },
  { id: "VERIFY", label: "인증" },
  { id: "STORY", label: "이야기" },
];

const bragOptions: { id: BragType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "NONE", label: "일상", icon: "chatbubble-ellipses-outline" },
  { id: "POINT", label: "포인트 자랑", icon: "star-outline" },
  { id: "BADGE", label: "배지 자랑", icon: "ribbon-outline" },
  { id: "RECRUIT", label: "미션 모집", icon: "people-outline" },
];

export default function CommunityScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [tab, setTab] = useState<CommunityTab>("ALL");
  const [posts, setPosts] = useState<CommunityPost[]>(SEED_POSTS);
  const [composerOpen, setComposerOpen] = useState(false);
  const [postCategory, setPostCategory] = useState<"VERIFY" | "STORY">("STORY");
  const [brag, setBrag] = useState<BragType>("NONE");
  const [body, setBody] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as CommunityPost[];
        const withSystemRule = saved.some((post) => post.id === SYSTEM_NEWS.id)
          ? saved
          : [SYSTEM_NEWS, ...saved];
        setPosts(withSystemRule);
      } catch {
        setPosts(SEED_POSTS);
      }
    });
  }, []);

  const persist = (next: CommunityPost[]) => {
    setPosts(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const visiblePosts = useMemo(
    () => (tab === "ALL" ? posts : posts.filter((post) => post.category === tab)),
    [posts, tab],
  );

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.82,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const publish = () => {
    const clean = body.trim();
    if (!clean && !photoUri) return;
    const title =
      postCategory === "VERIFY"
        ? "새 미션 인증을 공유했어요"
        : brag === "POINT"
          ? "포인트 기록을 자랑했어요"
          : brag === "BADGE"
            ? "새 배지를 자랑했어요"
            : brag === "RECRUIT"
              ? "함께할 이웃을 찾고 있어요"
              : "우리 동네 이야기를 남겼어요";
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      category: postCategory,
      title,
      body: clean || "사진으로 동네의 변화를 공유했어요.",
      author: user?.nickname ?? "동네 주민",
      neighborhood: user?.neighborhoodName ?? "서초2동",
      timeLabel: "방금",
      image: photoUri,
      verified: postCategory === "VERIFY",
      brag: postCategory === "STORY" ? brag : "NONE",
      likes: 0,
      liked: false,
      comments: [],
    };
    persist([post, ...posts]);
    setBody("");
    setPhotoUri(null);
    setBrag("NONE");
    setComposerOpen(false);
    setTab("ALL");
  };

  const toggleLike = (id: string) => {
    persist(posts.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post));
  };

  const addComment = (id: string) => {
    const clean = comment.trim();
    if (!clean) return;
    persist(posts.map((post) => post.id === id ? { ...post, comments: [...post.comments, { id: `comment-${Date.now()}`, author: user?.nickname ?? "동네 주민", body: clean }] } : post));
    setComment("");
    setCommentingId(null);
  };

  return (
    <ScreenSurface keyboardShouldPersistTaps="handled">
      <AppHeader title="커뮤니티" />
      <View style={styles.introRow}>
        <View style={styles.introCopy}><Text style={[styles.subtitle, { color: colors.text }]}>서초2동 이웃 피드</Text><Text style={[styles.introMeta, { color: colors.muted }]}>인증과 소식은 동네 주민에게만 보여요.</Text></View>
        <Pressable accessibilityLabel="게시글 작성" onPress={() => setComposerOpen(true)} style={[styles.writeButton, { backgroundColor: colors.green }]}><Ionicons name="add" size={20} color="#17310b" /><Text style={styles.writeButtonText}>글쓰기</Text></Pressable>
      </View>

      <SurfaceCard style={[styles.xpCard, { backgroundColor: colors.surfaceRaised }]}>
        <View style={[styles.xpIcon, { backgroundColor: colors.greenSoft }]}><Ionicons name="people" size={22} color={colors.green} /></View>
        <View style={styles.xpCopy}><Text style={[styles.xpTitle, { color: colors.text }]}>서초2동 레벨 7</Text><Text style={[styles.xpMeta, { color: colors.muted }]}>Community XP · 주민 공동 성장</Text></View>
        <View style={styles.xpValueWrap}><Text style={[styles.xpValue, { color: colors.green }]}>73</Text><Text style={[styles.xpTotal, { color: colors.muted }]}>/100</Text></View>
      </SurfaceCard>

      <View accessibilityRole="tablist" style={styles.tabs}>{tabs.map((item) => {
        const active = item.id === tab;
        return <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => setTab(item.id)} style={[styles.tab, { backgroundColor: active ? colors.green : colors.surface, borderColor: active ? colors.green : colors.border }]}><Text style={[styles.tabText, { color: active ? "#17310b" : colors.text }]}>{item.label}</Text></Pressable>;
      })}</View>

      <View style={styles.feedHeader}><Text style={[styles.sectionTitle, { color: colors.text }]}>{tab === "ALL" ? "지금 우리 동네" : tabs.find((item) => item.id === tab)?.label}</Text><View style={[styles.localOnly, { backgroundColor: colors.greenSoft }]}><Ionicons name="shield-checkmark" size={12} color={colors.greenInk} /><Text style={[styles.localOnlyText, { color: colors.greenInk }]}>동네 인증 피드</Text></View></View>

      {visiblePosts.map((post) => (
        <SurfaceCard key={post.id} style={styles.post}>
          <View style={styles.postHeader}>
            <View style={[styles.avatar, { backgroundColor: post.system ? colors.greenSoft : colors.surfaceRaised }]}><Ionicons name={post.system ? "sparkles" : "person"} size={18} color={post.system ? colors.green : colors.purple} /></View>
            <View style={styles.authorCopy}><View style={styles.authorRow}><Text style={[styles.author, { color: colors.text }]}>{post.author}</Text>{post.system ? <View style={[styles.systemBadge, { backgroundColor: colors.green }]}><Text style={styles.systemBadgeText}>자동 소식</Text></View> : null}</View><Text style={[styles.postMeta, { color: colors.muted }]}>{post.neighborhood} · {post.timeLabel}</Text></View>
            <Pressable accessibilityLabel="게시글 메뉴" onPress={() => Alert.alert("게시글 관리", post.system ? "시스템 소식은 숨길 수 있어요." : "신고하거나 이 게시글을 숨길 수 있어요.", [{ text: "취소", style: "cancel" }, { text: "숨기기" }])}><Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} /></Pressable>
          </View>

          <View style={styles.postTagRow}>
            <View style={[styles.categoryBadge, { backgroundColor: post.category === "NEWS" ? colors.greenSoft : colors.surfaceRaised }]}><Ionicons name={post.category === "NEWS" ? "newspaper-outline" : post.category === "VERIFY" ? "checkmark-circle-outline" : post.brag === "RECRUIT" ? "people-outline" : "chatbubble-ellipses-outline"} size={13} color={post.category === "NEWS" ? colors.greenInk : colors.purple} /><Text style={[styles.categoryText, { color: post.category === "NEWS" ? colors.greenInk : colors.text }]}>{post.category === "NEWS" ? "동네 소식" : post.category === "VERIFY" ? "미션 인증" : post.brag === "POINT" ? "포인트 자랑" : post.brag === "BADGE" ? "배지 자랑" : post.brag === "RECRUIT" ? "미션 모집" : "이웃 이야기"}</Text></View>
            {post.verified ? <View style={styles.verifiedRow}><Ionicons name="shield-checkmark" size={13} color={colors.green} /><Text style={[styles.verifiedText, { color: colors.green }]}>이웃 검토 완료</Text></View> : null}
          </View>
          <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
          <Text style={[styles.postBody, { color: colors.muted }]}>{post.body}</Text>

          {post.brag === "POINT" ? <View style={[styles.bragCard, { backgroundColor: colors.goldSurface, borderColor: colors.goldBorder }]}><Ionicons name="star" size={24} color={colors.gold} /><View><Text style={[styles.bragValue, { color: colors.gold }]}>1,250 P</Text><Text style={[styles.bragLabel, { color: colors.muted }]}>누적 미션 포인트</Text></View></View> : null}
          {post.brag === "BADGE" ? <View style={[styles.bragCard, { backgroundColor: colors.greenSoft, borderColor: colors.green }]}><Ionicons name="ribbon" size={26} color={colors.greenInk} /><View><Text style={[styles.bragValue, { color: colors.greenInk }]}>환경 지킴이</Text><Text style={[styles.bragLabel, { color: colors.muted }]}>벤치 정리 미션 5회 달성</Text></View></View> : null}
          {post.image ? <Image source={typeof post.image === "string" ? { uri: post.image } : post.image} style={[styles.postImage, { backgroundColor: colors.surfaceRaised }]} contentFit="cover" transition={180} /> : null}
          {post.rule ? <View style={[styles.ruleCard, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="flash-outline" size={14} color={colors.green} /><Text style={[styles.ruleText, { color: colors.muted }]}>{post.rule}</Text></View> : null}

          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => toggleLike(post.id)} style={styles.action}><Ionicons name={post.liked ? "heart" : "heart-outline"} size={18} color={post.liked ? colors.orange : colors.muted} /><Text style={[styles.actionText, { color: post.liked ? colors.orange : colors.muted }]}>{post.likes}</Text></Pressable>
            <Pressable onPress={() => setCommentingId(commentingId === post.id ? null : post.id)} style={styles.action}><Ionicons name="chatbubble-outline" size={17} color={colors.muted} /><Text style={[styles.actionText, { color: colors.muted }]}>{post.comments.length}</Text></Pressable>
            <Pressable onPress={() => { void Share.share({ message: `[동네모아] ${post.title}\n${post.body}` }); }} style={[styles.action, styles.shareAction]}><Ionicons name="share-social-outline" size={17} color={colors.muted} /><Text style={[styles.actionText, { color: colors.muted }]}>공유</Text></Pressable>
          </View>

          {post.comments.slice(-2).map((item) => <View key={item.id} style={[styles.commentRow, { backgroundColor: colors.surfaceRaised }]}><Text style={[styles.commentAuthor, { color: colors.text }]}>{item.author}</Text><Text style={[styles.commentBody, { color: colors.muted }]}>{item.body}</Text></View>)}
          {commentingId === post.id ? <View style={styles.commentComposer}><TextInput value={comment} onChangeText={setComment} placeholder="따뜻한 댓글을 남겨주세요" placeholderTextColor={colors.faint} style={[styles.commentInput, { backgroundColor: colors.surfaceRaised, color: colors.text }]} returnKeyType="send" onSubmitEditing={() => addComment(post.id)} /><Pressable accessibilityLabel="댓글 등록" onPress={() => addComment(post.id)} style={[styles.commentSend, { backgroundColor: colors.green }]}><Ionicons name="arrow-up" size={17} color="#17310b" /></Pressable></View> : null}
        </SurfaceCard>
      ))}

      <ComposerModal visible={composerOpen} category={postCategory} brag={brag} body={body} photoUri={photoUri} onChangeCategory={setPostCategory} onChangeBrag={setBrag} onChangeBody={setBody} onPickPhoto={() => { void pickPhoto(); }} onRemovePhoto={() => setPhotoUri(null)} onClose={() => setComposerOpen(false)} onPublish={publish} />
    </ScreenSurface>
  );
}

function ComposerModal({ visible, category, brag, body, photoUri, onChangeCategory, onChangeBrag, onChangeBody, onPickPhoto, onRemovePhoto, onClose, onPublish }: { visible: boolean; category: "VERIFY" | "STORY"; brag: BragType; body: string; photoUri: string | null; onChangeCategory: (value: "VERIFY" | "STORY") => void; onChangeBrag: (value: BragType) => void; onChangeBody: (value: string) => void; onPickPhoto: () => void; onRemovePhoto: () => void; onClose: () => void; onPublish: () => void }) {
  const { colors } = useTheme();
  const canPublish = body.trim().length > 0 || Boolean(photoUri);
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView style={[styles.composerSafe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.composerFlex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.composerHeader, { borderBottomColor: colors.border }]}><Pressable onPress={onClose}><Text style={[styles.composerCancel, { color: colors.muted }]}>취소</Text></Pressable><Text style={[styles.composerTitle, { color: colors.text }]}>동네에 글쓰기</Text><Pressable disabled={!canPublish} onPress={onPublish}><Text style={[styles.composerPublish, { color: canPublish ? colors.green : colors.faint }]}>게시</Text></Pressable></View>
        <View style={styles.composerBody}>
          <Text style={[styles.composerLabel, { color: colors.text }]}>어떤 이야기인가요?</Text>
          <View style={styles.categorySelect}><Pressable onPress={() => onChangeCategory("STORY")} style={[styles.categoryOption, { backgroundColor: category === "STORY" ? colors.green : colors.surface, borderColor: category === "STORY" ? colors.green : colors.border }]}><Ionicons name="chatbubbles-outline" size={17} color={category === "STORY" ? "#17310b" : colors.text} /><Text style={[styles.categoryOptionText, { color: category === "STORY" ? "#17310b" : colors.text }]}>이웃 이야기</Text></Pressable><Pressable onPress={() => onChangeCategory("VERIFY")} style={[styles.categoryOption, { backgroundColor: category === "VERIFY" ? colors.green : colors.surface, borderColor: category === "VERIFY" ? colors.green : colors.border }]}><Ionicons name="checkmark-circle-outline" size={17} color={category === "VERIFY" ? "#17310b" : colors.text} /><Text style={[styles.categoryOptionText, { color: category === "VERIFY" ? "#17310b" : colors.text }]}>미션 인증</Text></Pressable></View>
          {category === "STORY" ? <><Text style={[styles.composerLabel, { color: colors.text }]}>이야기 주제</Text><View style={styles.bragOptions}>{bragOptions.map((item) => { const active = brag === item.id; return <Pressable key={item.id} onPress={() => onChangeBrag(item.id)} style={[styles.bragOption, { backgroundColor: active ? colors.greenSoft : colors.surface, borderColor: active ? colors.green : colors.border }]}><Ionicons name={item.icon} size={16} color={active ? colors.greenInk : colors.muted} /><Text style={[styles.bragOptionText, { color: active ? colors.greenInk : colors.text }]}>{item.label}</Text></Pressable>; })}</View></> : null}
          <TextInput autoFocus multiline value={body} onChangeText={onChangeBody} placeholder={category === "VERIFY" ? "어떤 미션을 어떻게 완료했는지 알려주세요." : "이웃과 나누고 싶은 이야기를 적어주세요."} placeholderTextColor={colors.faint} textAlignVertical="top" style={[styles.postInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]} />
          {photoUri ? <View style={styles.previewWrap}><Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" /><Pressable accessibilityLabel="첨부 사진 삭제" onPress={onRemovePhoto} style={styles.removePhoto}><Ionicons name="close" size={17} color="#fff" /></Pressable></View> : <Pressable onPress={onPickPhoto} style={[styles.photoButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="images-outline" size={21} color={colors.green} /><View><Text style={[styles.photoButtonTitle, { color: colors.text }]}>사진 첨부</Text><Text style={[styles.photoButtonMeta, { color: colors.muted }]}>현장 사진이나 자랑하고 싶은 배지를 올려요.</Text></View></Pressable>}
          <View style={[styles.communityGuide, { backgroundColor: colors.surfaceRaised }]}><Ionicons name="shield-checkmark-outline" size={18} color={colors.green} /><Text style={[styles.communityGuideText, { color: colors.muted }]}>정확한 위치와 개인정보가 사진에 보이지 않는지 확인해주세요. 동네 소식은 조건 달성 시 시스템이 자동으로 올려요.</Text></View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  introRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  introCopy: { flex: 1 },
  subtitle: { fontFamily: "WantedSansB", fontSize: 22 },
  introMeta: { fontFamily: "WantedSansR", fontSize: 10, marginTop: 4 },
  writeButton: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 12, paddingVertical: 9 },
  writeButtonText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 11 },
  xpCard: { alignItems: "center", flexDirection: "row", marginTop: 18 },
  xpIcon: { alignItems: "center", borderRadius: 999, height: 46, justifyContent: "center", width: 46 },
  xpCopy: { flex: 1, marginLeft: 11 },
  xpTitle: { fontFamily: "WantedSansB", fontSize: 14 },
  xpMeta: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 4 },
  xpValueWrap: { alignItems: "flex-end" },
  xpValue: { fontFamily: "WantedSansB", fontSize: 19 },
  xpTotal: { fontFamily: "WantedSansR", fontSize: 9 },
  tabs: { flexDirection: "row", gap: 7, marginTop: 18 },
  tab: { alignItems: "center", borderRadius: 999, borderWidth: 1, flex: 1, paddingVertical: 8 },
  tabText: { fontFamily: "WantedSansB", fontSize: 10 },
  feedHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  sectionTitle: { fontFamily: "WantedSansB", fontSize: 19 },
  localOnly: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  localOnlyText: { fontFamily: "WantedSansB", fontSize: 8 },
  post: { marginTop: 11, padding: 14 },
  postHeader: { alignItems: "center", flexDirection: "row" },
  avatar: { alignItems: "center", borderRadius: 999, height: 40, justifyContent: "center", width: 40 },
  authorCopy: { flex: 1, marginLeft: 10 },
  authorRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  author: { fontFamily: "WantedSansB", fontSize: 12 },
  systemBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3 },
  systemBadgeText: { color: "#17310b", fontFamily: "WantedSansB", fontSize: 7 },
  postMeta: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 3 },
  postTagRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 13 },
  categoryBadge: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  categoryText: { fontFamily: "WantedSansB", fontSize: 9 },
  verifiedRow: { alignItems: "center", flexDirection: "row", gap: 3 },
  verifiedText: { fontFamily: "WantedSansB", fontSize: 8 },
  postTitle: { fontFamily: "WantedSansB", fontSize: 16, lineHeight: 22, marginTop: 12 },
  postBody: { fontFamily: "WantedSansR", fontSize: 11, lineHeight: 18, marginTop: 6 },
  postImage: { borderRadius: 14, height: 190, marginTop: 12, width: "100%" },
  bragCard: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 12, padding: 13 },
  bragValue: { fontFamily: "WantedSansB", fontSize: 15 },
  bragLabel: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 2 },
  ruleCard: { alignItems: "center", borderRadius: 11, flexDirection: "row", gap: 6, marginTop: 10, padding: 9 },
  ruleText: { flex: 1, fontFamily: "WantedSansR", fontSize: 8 },
  actions: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", marginTop: 13, paddingTop: 11 },
  action: { alignItems: "center", flexDirection: "row", gap: 5, marginRight: 20 },
  shareAction: { marginLeft: "auto", marginRight: 0 },
  actionText: { fontFamily: "WantedSansB", fontSize: 9 },
  commentRow: { borderRadius: 10, flexDirection: "row", gap: 7, marginTop: 8, paddingHorizontal: 10, paddingVertical: 8 },
  commentAuthor: { fontFamily: "WantedSansB", fontSize: 9 },
  commentBody: { flex: 1, fontFamily: "WantedSansR", fontSize: 9 },
  commentComposer: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 9 },
  commentInput: { borderRadius: 999, flex: 1, fontFamily: "WantedSansR", fontSize: 10, paddingHorizontal: 13, paddingVertical: 9 },
  commentSend: { alignItems: "center", borderRadius: 999, height: 36, justifyContent: "center", width: 36 },
  composerSafe: { flex: 1 },
  composerFlex: { flex: 1 },
  composerHeader: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 58, paddingHorizontal: 20 },
  composerCancel: { fontFamily: "WantedSansR", fontSize: 13 },
  composerTitle: { fontFamily: "WantedSansB", fontSize: 16 },
  composerPublish: { fontFamily: "WantedSansB", fontSize: 13 },
  composerBody: { flex: 1, padding: 20 },
  composerLabel: { fontFamily: "WantedSansB", fontSize: 12, marginBottom: 9, marginTop: 12 },
  categorySelect: { flexDirection: "row", gap: 8 },
  categoryOption: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  categoryOptionText: { fontFamily: "WantedSansB", fontSize: 10 },
  bragOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  bragOption: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  bragOptionText: { fontFamily: "WantedSansB", fontSize: 9 },
  postInput: { borderRadius: 17, borderWidth: 1, fontFamily: "WantedSansR", fontSize: 13, lineHeight: 20, marginTop: 18, minHeight: 150, padding: 15 },
  photoButton: { alignItems: "center", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 11, marginTop: 12, padding: 13 },
  photoButtonTitle: { fontFamily: "WantedSansB", fontSize: 11 },
  photoButtonMeta: { fontFamily: "WantedSansR", fontSize: 9, marginTop: 3 },
  previewWrap: { marginTop: 12, position: "relative" },
  preview: { borderRadius: 16, height: 210, width: "100%" },
  removePhoto: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.68)", borderRadius: 999, height: 31, justifyContent: "center", position: "absolute", right: 9, top: 9, width: 31 },
  communityGuide: { alignItems: "flex-start", borderRadius: 14, flexDirection: "row", gap: 8, marginTop: 12, padding: 12 },
  communityGuideText: { flex: 1, fontFamily: "WantedSansR", fontSize: 9, lineHeight: 15 },
});
