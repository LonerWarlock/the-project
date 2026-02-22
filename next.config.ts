import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: async () => {
    const apiUrl = process.env.PYTHON_API_URL || "http://localhost:8000";
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  reactCompiler: true,
};

export default nextConfig;
