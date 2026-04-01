import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rewrites: async () => {
    const apiUrl = process.env.PYTHON_API_URL || "http://localhost:8000";
    return [
      {
        /**
         * This regex matches all /api/:path* EXCEPT when the path starts with 'auth'.
         * This allows NextAuth to handle /api/auth while your Python 
         * backend handles everything else.
         */
        source: '/api/((?!auth).*)', 
        destination: `${apiUrl}/api/:1`,
      },
    ]
  },
  reactCompiler: true,
};

export default nextConfig;