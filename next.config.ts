import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Profile pictures from the sign-in providers (app sidebar) and YouTube thumbnails (courses).
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
}

export default nextConfig
