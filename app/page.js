import { Music } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
           style={{ background: "linear-gradient(135deg, #a78bfa, #ec4899)" }}>
        <Music size={32} color="white" />
      </div>
      <h1 className="text-3xl font-extrabold text-center mb-2"
          style={{ background: "linear-gradient(90deg, #a78bfa, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Automated Event Tracker
      </h1>
      <p className="text-slate-400 text-center max-w-md">
        Track live music events, discover upcoming shows, and sync to Google Calendar.
      </p>
      <div className="mt-6 px-4 py-2 rounded-full text-sm font-semibold"
           style={{ background: "#7c3aed22", border: "1px solid #7c3aed44", color: "#a78bfa" }}>
        Coming Soon
      </div>
    </main>
  );
}
