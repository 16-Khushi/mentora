import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Profile pictures from the sign-in providers, shown in the app sidebar.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
}

export default nextConfig
