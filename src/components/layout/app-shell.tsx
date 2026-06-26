import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <ChatWidget />
      </div>
    </TooltipProvider>
  );
}
