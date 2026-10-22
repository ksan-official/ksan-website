"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, Bookmark, Heart, MapPin, MessageCircle, Plus, Search, ShoppingBag, X } from "lucide-react";
import { localNickname, useLocalActivities } from "@/lib/local-activity";
import type { ActivityKind, LocalActivity } from "@/lib/local-activity";
import { useMyPageSearch } from "@/components/MyPageWorkspace";
import styles from "./LocalActivityBoard.module.css";
import { MarketProductDetail } from "./MarketProductDetail";

const categories = {
  community: ["전체", "질문", "정보", "일상"],
  market: ["전체", "자전거", "생활용품", "가구", "교재 · 책", "주방용품", "무료 나눔"]
};
function ActivityDialog({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}><X size={20} /></button>{children}
  </dialog>;
}

export function LocalActivityBoard({ kind, history = false, recordId, viewMessages = false }: { kind: ActivityKind; history?: boolean; recordId?: string; viewMessages?: boolean }) {
  const router = useRouter();
  const { records, add, change } = useLocalActivities();
  const workspaceQuery = useMyPageSearch();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [tab, setTab] = useState("mine");
  const [creating, setCreating] = useState(false);
  const [contacting, setContacting] = useState(viewMessages);
  const [error, setError] = useState("");
  const selected = records.find((record) => record.id === recordId && record.kind === kind);
  const isMarket = kind === "market";
  const communityLayout = !isMarket && !history;
  const historyTabs = isMarket ? [{ id: "mine", label: "내 판매" }, { id: "saved", label: "저장한 상품" }, { id: "messages", label: "문의 내역" }] : [{ id: "mine", label: "내 글" }, { id: "replies", label: "내 댓글" }, { id: "saved", label: "저장한 글" }];
  const search = (history ? workspaceQuery : query).trim().toLocaleLowerCase();
  const visible = records.filter((record) => {
    if (record.kind !== kind) return false;
    if (!`${record.title} ${record.body} ${record.city} ${record.author}`.toLocaleLowerCase().includes(search)) return false;
    if (history) {
      if (tab === "mine") return record.owned;
      if (tab === "saved") return record.saved;
      if (tab === "replies") return record.replies.some((reply) => reply.author === localNickname);
      return record.messages.length > 0;
    }
    return category === "전체" || record.category === category;
  });
  function recordHref(record: LocalActivity) {
    const path = `${isMarket ? "/pass-it-on" : "/community"}/${encodeURIComponent(record.id)}`;
    return history && tab === "messages" ? `${path}?view=messages#messages` : history && tab === "replies" ? `${path}#comments` : path;
  }
  function toggleSaved(record: LocalActivity) { change(record.id, (current) => ({ ...current, saved: !current.saved })); }
  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let image = "";
    const file = data.get("photo");
    if (file instanceof File && file.size) {
      if (!file.type.startsWith("image/")) { setError("이미지 파일을 선택해주세요."); return; }
      if (file.size > 2 * 1024 * 1024) { setError("사진은 2MB 이하로 선택해주세요."); return; }
      try {
        image = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      } catch { setError("사진을 읽지 못했어요. 다시 선택해주세요."); return; }
    }
    const title = String(data.get("title") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();
    if (!title || !body) { setError("제목과 내용을 입력해주세요."); return; }
    const record: LocalActivity = { id: crypto.randomUUID(), kind, title, body, author: localNickname, category: String(data.get("category")), city: String(data.get("city") ?? "").trim(), price: Number(data.get("price") || 0), image, createdAt: new Date().toISOString(), owned: true, saved: false, liked: false, likes: 0, sold: false, replies: [], messages: [] };
    add(record);
    setCreating(false); setTab("mine"); setCategory("전체"); setQuery(""); router.push(recordHref(record));
  }
  function sendReply(event: FormEvent<HTMLFormElement>, message = false) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    const entry = { id: crypto.randomUUID(), author: localNickname, body };
    change(selected.id, (record) => message ? { ...record, messages: [...record.messages, entry] } : { ...record, replies: [...record.replies, entry] });
    form.reset();
  }
  if (recordId && isMarket && selected) {
    return <MarketProductDetail product={selected}
      related={records.filter((record) => record.kind === "market" && record.id !== selected.id && !record.sold).slice(0, 3)}
      contacting={contacting} onContact={() => setContacting(true)} onSave={() => toggleSaved(selected)}
      onToggleSold={() => change(selected.id, (record) => ({ ...record, sold: !record.sold }))}
      onMessage={(event) => sendReply(event, true)} />;
  }
  if (recordId) {
    return <div className={styles.board}>
      <nav className={styles.detailNav} aria-label="게시글 이동"><Link href={isMarket ? "/pass-it-on" : "/community"}>← {isMarket ? "중고거래" : "케이숲"} 목록</Link><Link href={isMarket ? "/mypage/pass-it-on" : "/mypage/community"}>내 활동 <ArrowUpRight size={15} aria-hidden /></Link></nav>
      {selected ? (
      <div className={styles.detail}>
        {isMarket && selected.image && <div className={styles.detailImage} role="img" aria-label={selected.title} style={{ backgroundImage: `url("${selected.image}")` }} />}
        <p className={styles.postMeta}>{selected.category} · {selected.author}</p><h1>{selected.title}</h1>
        {isMarket && <div className={styles.detailPrice}>{selected.price === 0 ? "무료 나눔" : `€ ${selected.price}`}<span><MapPin size={14} aria-hidden />{selected.city} · {selected.sold ? "거래 완료" : "판매 중"}</span></div>}
        <p className={styles.bodyText}>{selected.body}</p>
        <div className={styles.detailActions}>
          {!isMarket && <button type="button" aria-pressed={selected.liked} onClick={() => change(selected.id, (record) => ({ ...record, liked: !record.liked, likes: record.likes + (record.liked ? -1 : 1) }))}><Heart size={17} fill={selected.liked ? "currentColor" : "none"} />좋아요 {selected.likes}</button>}
          <button type="button" aria-pressed={selected.saved} onClick={() => toggleSaved(selected)}><Bookmark size={17} fill={selected.saved ? "currentColor" : "none"} />{selected.saved ? "저장됨" : "저장"}</button>
          {isMarket && (selected.owned ? <button type="button" onClick={() => change(selected.id, (record) => ({ ...record, sold: !record.sold }))}>{selected.sold ? "다시 판매하기" : "거래 완료로 변경"}</button> : <button type="button" disabled={selected.sold} onClick={() => setContacting(true)}>판매자에게 문의</button>)}
        </div>
        {!isMarket ? <section className={styles.replies} aria-label="댓글" id="comments"><h3>댓글 {selected.replies.length}</h3>{selected.replies.map((reply) => <div key={reply.id}><strong>{reply.author}</strong><p>{reply.body}</p></div>)}<form onSubmit={(event) => sendReply(event)}><label htmlFor="community-reply">댓글 남기기</label><textarea id="community-reply" name="body" required maxLength={1000} placeholder="댓글을 입력해주세요" /><button className={styles.primary} type="submit">등록</button></form></section> : (contacting || (history && tab === "messages") || (selected.owned && selected.messages.length > 0)) && <section className={styles.replies} aria-label="판매자 문의" id="messages"><h3>{selected.owned ? "구매 문의" : "판매자에게 문의"}</h3>{selected.messages.map((message) => <div key={message.id}><strong>{message.author}</strong><p>{message.body}</p></div>)}<form onSubmit={(event) => sendReply(event, true)}><label htmlFor="market-message">문의 메시지</label><textarea id="market-message" name="body" required maxLength={1000} placeholder="거래 가능한 시간이나 궁금한 점을 남겨주세요" /><button className={styles.primary} type="submit">보내기</button></form></section>}
      </div>

      ) : <div className={styles.empty}><h1>{isMarket ? "상품" : "게시글"}을 찾을 수 없어요.</h1><p>삭제되었거나 이 브라우저에 저장되지 않은 글입니다.</p></div>}
    </div>;
  }
  return <div className={`${styles.board} ${communityLayout ? styles.communityLayout : ""}`}>
    {communityLayout && <aside className={styles.communitySidebar}>
      <Link className={styles.forestName} href="/community">케이숲</Link>
      <p>게시판</p>
      <nav aria-label="케이숲 카테고리">{categories.community.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === "전체" ? "전체 글" : item}</button>)}</nav>
      <Link className={styles.myCommunity} href="/mypage/community">내 활동 <ArrowUpRight size={14} aria-hidden /></Link>
    </aside>}
    {!history && <div className={styles.heading}><div><h1>{isMarket ? "중고거래" : category === "전체" ? "전체 글" : `${category} 게시판`}</h1><p>{isMarket ? "필요한 물건을 찾고, 쓰던 물건을 나눠요." : "네덜란드 생활의 궁금한 것부터 소소한 일상까지."}</p></div><Link href={isMarket ? "/mypage/pass-it-on" : "/mypage/community"}>내 활동 <ArrowUpRight size={16} aria-hidden /></Link></div>}
    <div className={styles.toolbar}>
      {history ? <nav className={styles.tabs} aria-label="활동 구분">{historyTabs.map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav> : <label className={styles.search}><Search size={17} aria-hidden /><input aria-label={isMarket ? "상품 검색" : "게시글 검색"} placeholder={isMarket ? "어떤 물건을 찾으세요?" : "게시글 검색"} value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
      <div className={styles.toolbarActions}>{history && <Link href={isMarket ? "/pass-it-on" : "/community"}>{isMarket ? "전체 상품" : "전체 게시글"}<ArrowUpRight size={14} aria-hidden /></Link>}<button type="button" className={styles.primary} onClick={() => { setError(""); setCreating(true); }}><Plus size={16} aria-hidden />{isMarket ? "판매하기" : "글쓰기"}</button></div>
    </div>
    {!history && isMarket && <nav className={styles.categories} aria-label="카테고리">{categories[kind].map((item) => <button type="button" aria-pressed={category === item} onClick={() => setCategory(item)} key={item}>{item}</button>)}</nav>}
    <div className={isMarket ? styles.marketGrid : styles.postList}>
      {visible.map((record) => isMarket ? <article className={styles.product} key={record.id}>
        <Link className={styles.productOpen} href={recordHref(record)}><span className={styles.productImage} role="img" aria-label={record.title} style={record.image ? { backgroundImage: `url("${record.image}")` } : undefined}>{!record.image && <ShoppingBag size={32} strokeWidth={1.2} />}</span><span className={styles.productCity}>{record.city}{record.sold ? " · 거래 완료" : ""}</span><strong>{record.title}</strong><span className={styles.price}>{record.price === 0 ? "무료 나눔" : `€ ${record.price}`}</span></Link>
        <button type="button" className={styles.save} aria-label={`${record.title} ${record.saved ? "저장 취소" : "저장"}`} aria-pressed={record.saved} onClick={() => toggleSaved(record)}><Bookmark size={18} fill={record.saved ? "currentColor" : "none"} /></button>
      </article> : <article className={styles.post} key={record.id}>
        <div className={styles.postMain}><span className={styles.postMeta}>{record.category} · {record.author}</span><Link className={styles.postTitle} href={recordHref(record)}>{record.title}</Link><p>{record.body}</p><div className={styles.postStats}><span><Heart size={14} aria-hidden />{record.likes}</span><span><MessageCircle size={14} aria-hidden />{record.replies.length}</span></div></div><button type="button" className={styles.inlineSave} aria-label={`${record.title} ${record.saved ? "저장 취소" : "저장"}`} aria-pressed={record.saved} onClick={() => toggleSaved(record)}><Bookmark size={18} fill={record.saved ? "currentColor" : "none"} /></button>
      </article>)}
    </div>
    {!visible.length && <div className={styles.empty}><p>{search ? "검색 결과가 없어요." : "아직 활동 내역이 없어요."}</p><Link href={isMarket ? "/pass-it-on" : "/community"}>{isMarket ? "상품 둘러보기" : "케이숲 둘러보기"} <ArrowUpRight size={15} aria-hidden /></Link></div>}
    {creating && <ActivityDialog title={isMarket ? "판매 글 등록" : "글쓰기"} onClose={() => setCreating(false)}><form className={styles.createForm} onSubmit={createRecord}><h2>{isMarket ? "판매 글 등록" : "글쓰기"}</h2><p className={styles.postMeta}>{localNickname} 닉네임으로 등록됩니다.</p><label>카테고리<select name="category">{categories[kind].slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>제목<input name="title" required maxLength={100} placeholder={isMarket ? "어떤 물건을 판매하시나요?" : "제목을 입력해주세요"} /></label>{isMarket && <><div className={styles.formRow}><label>가격 (€)<input name="price" type="number" min="0" max="100000" step="0.01" required defaultValue="0" /></label><label>거래 지역<input name="city" required placeholder="Amsterdam" maxLength={80} /></label></div><label>사진<input type="file" name="photo" accept="image/*" /><small>2MB 이하 이미지 1장</small></label></>}<label>내용<textarea name="body" required maxLength={5000} rows={5} placeholder={isMarket ? "상품 상태와 거래 방법을 알려주세요" : "나누고 싶은 이야기를 적어주세요"} /></label>{error && <p className={styles.error} role="alert">{error}</p>}<button type="submit" className={styles.primary}>등록하기</button></form></ActivityDialog>}
  </div>;
}
