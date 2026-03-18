/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Google Calendar requires URLs ending in .ics
          // /agenda/1.ics  →  /api/agenda/ical?userId=1
          source: '/agenda/:userId.ics',
          destination: '/api/agenda/ical?userId=:userId',
        },
      ],
    }
  },
}

export default nextConfig