import { SideMenu } from "./components/SideMenu";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-zinc-950 text-zinc-100 overflow-x-hidden lg:flex-row">
      <SideMenu />
      <main className="min-h-screen min-w-0 flex-1 overflow-x-auto px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
