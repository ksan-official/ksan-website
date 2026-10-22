"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ChevronRight, Heart, MapPin, ShoppingBag } from "lucide-react";
import type { LocalActivity } from "@/lib/local-activity";
import styles from "./MarketProductDetail.module.css";

type Props = {
  product: LocalActivity;
  related: LocalActivity[];
  contacting: boolean;
  onContact: () => void;
  onSave: () => void;
  onToggleSold: () => void;
  onMessage: (event: FormEvent<HTMLFormElement>) => void;
};

function price(product: LocalActivity) {
  return product.price === 0 ? "나눔" : `€${product.price.toLocaleString("nl-NL")}`;
}

export function MarketProductDetail({ product, related, contacting, onContact, onSave, onToggleSold, onMessage }: Props) {
  const messagesRef = useRef<HTMLElement>(null);
  const showMessages = contacting || (product.owned && product.messages.length > 0);
  useEffect(() => {
    if (contacting) messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [contacting]);

  return <div className={styles.product}>
    <nav className={styles.nav} aria-label="상품 이동">
      <Link href="/pass-it-on"><ArrowLeft size={17} aria-hidden />중고거래</Link>
      <Link href="/mypage/pass-it-on">내 거래</Link>
    </nav>
    <div className={styles.photo}>
      {product.image ? <Image src={product.image} alt={product.title} fill sizes="(max-width: 728px) calc(100vw - 40px), 688px" unoptimized priority /> : <ShoppingBag size={56} aria-label="상품 사진 없음" strokeWidth={1} />}
    </div>
    <div className={styles.seller}>
      <span className={styles.avatar} aria-hidden>{product.author.slice(0, 1)}</span>
      <div><strong>{product.author}</strong><span>{product.city}</span></div>
      <span className={styles.sellerLabel}>판매자</span>
    </div>
    <article className={styles.description}>
      <h1>{product.title}</h1>
      <p className={styles.meta}>{product.category} · <time dateTime={product.createdAt}>{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(product.createdAt))}</time></p>
      <p className={styles.price}>{price(product)}{product.sold && <span>거래 완료</span>}</p>
      <p className={styles.body}>{product.body}</p>
      <p className={styles.stats}>{product.saved ? "관심 있는 상품" : "관심 상품으로 저장해보세요"} · 문의 {product.messages.length}</p>
    </article>
    <section className={styles.location} aria-label="거래 장소">
      <div><MapPin size={19} aria-hidden /><div><h2>거래 희망 지역</h2><p>{product.city}</p></div></div>
      <span>직거래</span>
    </section>
    {showMessages && <section className={styles.messages} ref={messagesRef} id="messages" aria-label="판매자 문의">
      <h2>{product.owned ? "구매 문의" : "판매자에게 문의"}</h2>
      {product.messages.map((message) => <div className={styles.message} key={message.id}><strong>{message.author}</strong><p>{message.body}</p></div>)}
      <form onSubmit={onMessage}><label htmlFor="market-message">문의 메시지</label><textarea id="market-message" name="body" required maxLength={1000} placeholder="안녕하세요! 아직 판매 중인가요?" /><button type="submit">보내기</button></form>
    </section>}
    <div className={styles.tradeBar}>
      <button type="button" className={styles.favorite} aria-label={product.saved ? "관심 상품 해제" : "관심 상품 저장"} aria-pressed={product.saved} onClick={onSave}><Heart size={25} strokeWidth={1.6} fill={product.saved ? "currentColor" : "none"} /></button>
      <strong>{price(product)}</strong>
      <button type="button" className={styles.contact} disabled={!product.owned && product.sold} onClick={product.owned ? onToggleSold : onContact}>{product.owned ? product.sold ? "다시 판매하기" : "거래 완료로 변경" : product.sold ? "거래 완료" : "채팅하기"}</button>
    </div>
    {related.length > 0 && <section className={styles.related}>
      <header><h2>이런 상품도 있어요</h2><Link href="/pass-it-on">더 보기<ChevronRight size={15} aria-hidden /></Link></header>
      <div>{related.map((item) => <Link href={`/pass-it-on/${item.id}`} key={item.id}>{item.image ? <span className={styles.thumbnail}><Image src={item.image} alt={item.title} fill sizes="(max-width: 728px) 30vw, 220px" unoptimized /></span> : <span className={styles.placeholder}><ShoppingBag aria-hidden /></span>}<h3>{item.title}</h3><strong>{price(item)}</strong><span>{item.city}</span></Link>)}</div>
    </section>}
  </div>;
}
