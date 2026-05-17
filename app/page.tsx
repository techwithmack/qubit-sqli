import DashboardShell from "@/components/DashboardShell";

export default function Home() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html:
            "<!-- Training-only: contains deliberate SQLi and command-injection demos. -->",
        }}
      />
      <DashboardShell />
    </>
  );
}
