"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check, Send } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function AboutContactForm() {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitState("submitting");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          email: formData.get("email"),
          inquiryType: formData.get("inquiryType"),
          message: formData.get("message"),
          name: formData.get("name"),
          organization: formData.get("organization"),
          website: formData.get("website")
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "문의 접수 중 문제가 발생했습니다.");
      }

      form.reset();
      setSubmitState("success");
      setStatusMessage("문의가 접수되었습니다. 확인 후 입력하신 이메일로 연락드릴게요.");
    } catch (error) {
      setSubmitState("error");
      setStatusMessage(error instanceof Error ? error.message : "문의 접수 중 문제가 발생했습니다.");
    }
  }

  return (
    <div className="about-contact-form-panel" id="contact-details">
      <div className="about-contact-form-heading">
        <span>Send an inquiry</span>
        <h3>어떤 연결을 만들고 싶으신가요?</h3>
        <p>필요한 내용을 남겨주시면 담당자가 확인한 뒤 이메일로 답변드립니다.</p>
      </div>
      <form className="about-contact-form" onSubmit={submitInquiry}>
        <label className="about-contact-field about-contact-field-wide">
          <span>문의 유형 *</span>
          <select defaultValue="" name="inquiryType" required>
            <option disabled value="">문의 유형을 선택해주세요</option>
            <option value="partnership">후원 및 파트너십</option>
            <option value="program">행사·프로그램 공동 기획</option>
            <option value="career">채용·커리어 협업</option>
            <option value="media">미디어·콘텐츠 제휴</option>
            <option value="other">기타 문의</option>
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
          <textarea name="message" placeholder="제안 배경과 함께 만들고 싶은 내용을 자유롭게 알려주세요." required rows={5} />
        </label>
        <input aria-hidden autoComplete="off" className="about-contact-honeypot" name="website" tabIndex={-1} />
        <button className="about-contact-submit" disabled={submitState === "submitting"} type="submit">
          <span>{submitState === "submitting" ? "보내는 중" : submitState === "success" ? "접수 완료" : "문의 보내기"}</span>
          {submitState === "success" ? <Check aria-hidden size={19} /> : submitState === "submitting" ? <Send aria-hidden size={18} /> : <ArrowRight aria-hidden size={19} />}
        </button>
        <p aria-live="polite" className={`about-contact-status is-${submitState}`}>
          {statusMessage}
        </p>
      </form>
    </div>
  );
}
