import { MyPageWorkspace } from "@/components/MyPageWorkspace";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return <MyPageWorkspace>{children}</MyPageWorkspace>;
}
