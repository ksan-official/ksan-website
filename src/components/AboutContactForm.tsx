"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type ContactStatus = {
  message: string;
  type: "idle" | "success";
};

export function AboutContactForm() {
  const [status, setStatus] = useState<ContactStatus>({ message: "", type: "idle" });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    if (String(formData.get("website") ?? "").trim()) return;

    const inquiryType = String(formData.get("inquiryType") ?? "");
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const organization = String(formData.get("organization") ?? "");
    const message = String(formData.get("message") ?? "");
    const subject = encodeURIComponent(`[KSAN 문의] ${inquiryType || "문의"}`);
    const body = encodeURIComponent(
      [
        `문의 유형: ${inquiryType}`,
        `이름: ${name}`,
        `이메일: ${email}`,
        `소속: ${organization}`,
        "",
        message
      ].join("\n")
    );

    window.location.href = `mailto:hello@ksan.nl?subject=${subject}&body=${body}`;
    setStatus({ message: "메일 앱으로 문의 내용이 열립니다.", type: "success" });
  }

  return (
    <div className="about-contact-form-panel" id="contact-details">
      <div className="about-contact-form-heading">
        <span>Send an inquiry</span>
        <h3>어떤 연결을 만들고 싶으신가요?</h3>
        <p>필요한 내용을 남겨주시면 담당자가 확인한 뒤 이메일로 답변드립니다.</p>
      </div>
      <form className="about-contact-form" onSubmit={handleSubmit}>
        <label className="about-contact-field about-contact-field-wide">
          <span>문의 유형 *</span>
          <select name="inquiryType" required defaultValue="">
            <option value="" disabled>
              문의 유형을 선택해주세요
            </option>
            <option value="후원·파트너십">후원·파트너십</option>
            <option value="행사 공동 기획">행사 공동 기획</option>
            <option value="채용·커리어">채용·커리어</option>
            <option value="미디어·홍보">미디어·홍보</option>
            <option value="기타 문의">기타 문의</option>
          </select>
        </label>
        <label className="about-contact-field">
          <span>이름 *</span>
          <input autoComplete="name" name="name" placeholder="담당자 이름" required />
        </label>
        <label className="about-contact-field">
          <span>이메일 *</span>
          <input autoComplete="email" name="email" placeholder="name@example.com" required type="email" />
        </label>
        <label className="about-contact-field about-contact-field-wide">
          <span>소속</span>
          <input autoComplete="organization" name="organization" placeholder="기업, 학교 또는 단체명" />
        </label>
        <label className="about-contact-field about-contact-field-wide">
          <span>문의 내용 *</span>
          <textarea
            name="message"
            placeholder="제안 배경과 함께 만들고 싶은 내용을 자유롭게 알려주세요."
            required
            rows={5}
          />
        </label>
        <input aria-hidden autoComplete="off" className="about-contact-honeypot" name="website" tabIndex={-1} />
        <button className="about-contact-submit" type="submit">
          <span>문의 보내기</span>
          <ArrowRight aria-hidden size={24} />
        </button>
        <p aria-live="polite" className={`about-contact-status is-${status.type}`}>
          {status.message}
        </p>
      </form>
    </div>
  );
}
