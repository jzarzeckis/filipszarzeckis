import { Link } from "@/router";

export function About() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <Link
          to="/"
          className="text-sm text-white/50 hover:text-white/80 transition-colors mb-8 inline-block"
        >
          ← Back
        </Link>
        <h1 className="text-4xl font-bold mb-6">About</h1>
        <p className="text-white/60 text-lg leading-relaxed">
          Placeholder content for the About page. More details coming soon.
        </p>
      </div>
    </div>
  );
}
