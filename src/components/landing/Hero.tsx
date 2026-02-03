import { Link } from '@tanstack/react-router';

export default function Hero() {
  return (
    <div className="mt-32 text-center max-w-4xl mx-auto relative">
      {/* Red Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cream/5 blur-[120px] rounded-full -z-10" />

      <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
        Your shortcut to everything.
      </h1>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
        A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable.
      </p>

      <div className="flex items-center justify-center gap-4">
        <Link
          to="/register"
          className="rounded-lg bg-white px-6 py-3 text-base font-medium text-black hover:bg-white/90 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          Sign Up
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-medium text-white hover:bg-white/20 transition-colors"
        >
          Log In
        </Link>
      </div>
    </div>
  );
}
