"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminMember = {
  id: string;
  email: string;
  full_name: string | null;
  school: string | null;
  major: string | null;
  admission_year: number | null;
  role: "user" | "admin";
  created_at: string;
};

type MemberDetail = {
  member: AdminMember;
  activity: {
    savedGuides: Array<{
      slug: string;
      title: string;
      category: string;
      published: boolean | null;
      savedAt: string;
    }>;
    savedBusinessPosts: Array<{
      id: string | null;
      title: string;
      company: string | null;
      savedAt: string;
    }>;
    savedBusinessItems: Array<{
      job_id: string;
      created_at: string;
    }>;
    applications: Array<{
      id: string;
      application_type: "business_application" | "event_registration";
      target_id: string;
      full_name: string | null;
      email: string | null;
      school: string | null;
      major: string | null;
      admission_year: string | null;
      message: string | null;
      submitted_at: string;
      sheets_sync_status: string;
    }>;
    writtenPosts: Array<{
      id: string;
      title: string;
      created_at: string;
    }>;
  };
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [memberStatus, setMemberStatus] = useState("회원 목록을 불러오는 중입니다.");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [selectedMemberStatus, setSelectedMemberStatus] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        setMemberStatus("관리자 세션을 확인하지 못했습니다.");
        return;
      }

      setAccessToken(token);
      const response = await fetch("/api/admin/members", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (!response.ok) {
        setMemberStatus(`회원 목록을 불러오지 못했습니다. ${result.error ?? ""}`.trim());
        return;
      }
      setMembers(result.members ?? []);
      setMemberStatus((result.members ?? []).length ? "" : "아직 가입한 회원이 없습니다.");
    }).catch(() => setMemberStatus("회원 목록을 불러오지 못했습니다."));
  }, []);

  async function openMember(memberId: string) {
    if (!accessToken) {
      setSelectedMemberStatus("관리자 세션을 다시 확인해주세요.");
      return;
    }

    setSelectedMemberStatus("회원 활동을 불러오는 중입니다.");
    setSelectedMember(null);
    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      const result = await response.json();
      if (!response.ok) {
        setSelectedMemberStatus(`회원 활동을 불러오지 못했습니다. ${result.error ?? ""}`.trim());
        return;
      }
      setSelectedMember(result);
      setSelectedMemberStatus(null);
    } catch {
      setSelectedMemberStatus("회원 활동을 불러오지 못했습니다.");
    }
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Members</p>
          <h1>회원 관리</h1>
          <p>가입 회원과 저장·신청 내역을 확인합니다.</p>
        </div>
      </header>

      <section className="admin-section">
        <div className="admin-business-list-header">
          <strong>{members.length}명 회원</strong>
          <span>관리자 {members.filter((member) => member.role === "admin").length}명</span>
        </div>
        {memberStatus ? <div className="admin-status-line">{memberStatus}</div> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>학교 / 전공</th>
              <th>입학연도</th>
              <th>권한</th>
              <th>가입일</th>
            </tr>
          </thead>
          <tbody>
            {members.length ? (
              members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <button className="admin-link-button" type="button" onClick={() => openMember(member.id)}>
                      {member.full_name || "이름 미입력"}
                    </button>
                  </td>
                  <td>{member.email}</td>
                  <td>{[member.school, member.major].filter(Boolean).join(" / ") || "-"}</td>
                  <td>{member.admission_year ?? "-"}</td>
                  <td>{member.role === "admin" ? "관리자" : "회원"}</td>
                  <td>{new Date(member.created_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>표시할 회원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        {(selectedMemberStatus || selectedMember) ? (
          <div className="admin-member-detail">
            {selectedMemberStatus ? <div className="admin-status-line">{selectedMemberStatus}</div> : null}
            {selectedMember ? (
              <>
                <div className="admin-section-title-row">
                  <div>
                    <h2>{selectedMember.member.full_name || "이름 미입력"}</h2>
                    <p className="admin-note">{selectedMember.member.email}</p>
                  </div>
                  <button className="admin-button secondary" type="button" onClick={() => setSelectedMember(null)}>
                    닫기
                  </button>
                </div>
                <div className="admin-dashboard-grid compact">
                  <div className="admin-dashboard-card">
                    <span>저장한 가이드</span>
                    <strong>{selectedMember.activity.savedGuides.length}</strong>
                  </div>
                  <div className="admin-dashboard-card">
                    <span>저장한 공고</span>
                    <strong>
                      {selectedMember.activity.savedBusinessPosts.length + selectedMember.activity.savedBusinessItems.length}
                    </strong>
                  </div>
                  <div className="admin-dashboard-card">
                    <span>신청 내역</span>
                    <strong>{selectedMember.activity.applications.length}</strong>
                  </div>
                  <div className="admin-dashboard-card">
                    <span>작성글</span>
                    <strong>{selectedMember.activity.writtenPosts.length}</strong>
                  </div>
                </div>

                <div className="admin-member-activity-grid">
                  <section>
                    <h3>저장한 가이드</h3>
                    <ul className="admin-activity-list">
                      {selectedMember.activity.savedGuides.length ? selectedMember.activity.savedGuides.map((guide) => (
                        <li key={guide.slug}>
                          <strong>{guide.title}</strong>
                          <span>{guide.category} · {new Date(guide.savedAt).toLocaleDateString("ko-KR")}</span>
                        </li>
                      )) : <li><span>저장한 가이드가 없습니다.</span></li>}
                    </ul>
                  </section>

                  <section>
                    <h3>저장한 공고</h3>
                    <ul className="admin-activity-list">
                      {selectedMember.activity.savedBusinessPosts.map((post) => (
                        <li key={`${post.id}-${post.savedAt}`}>
                          <strong>{post.title}</strong>
                          <span>{post.company ?? "기업명 없음"} · {new Date(post.savedAt).toLocaleDateString("ko-KR")}</span>
                        </li>
                      ))}
                      {selectedMember.activity.savedBusinessItems.map((item) => (
                        <li key={`${item.job_id}-${item.created_at}`}>
                          <strong>{item.job_id}</strong>
                          <span>기본 공고 데이터 · {new Date(item.created_at).toLocaleDateString("ko-KR")}</span>
                        </li>
                      ))}
                      {!selectedMember.activity.savedBusinessPosts.length && !selectedMember.activity.savedBusinessItems.length ? (
                        <li><span>저장한 공고가 없습니다.</span></li>
                      ) : null}
                    </ul>
                  </section>

                  <section>
                    <h3>신청 내역</h3>
                    <ul className="admin-activity-list">
                      {selectedMember.activity.applications.length ? selectedMember.activity.applications.map((application) => (
                        <li key={application.id}>
                          <strong>{application.application_type === "event_registration" ? "행사 신청" : "공고 지원"}</strong>
                          <span>{application.target_id} · {new Date(application.submitted_at).toLocaleDateString("ko-KR")} · {application.sheets_sync_status}</span>
                        </li>
                      )) : <li><span>신청 내역이 없습니다.</span></li>}
                    </ul>
                  </section>

                  <section>
                    <h3>작성글</h3>
                    <ul className="admin-activity-list">
                      <li><span>아직 회원 작성글을 저장하는 테이블이 연결되지 않았습니다.</span></li>
                    </ul>
                  </section>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
