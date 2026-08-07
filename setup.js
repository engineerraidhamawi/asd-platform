const fs=require("fs");const p=require("path");const B="C:\\\\asd-platform";let c=0,s=0;function w(r,x){const f=p.join(B,r.replace(/\//g,p.sep));const d=p.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});if(fs.existsSync(f)){s++;return;}fs.writeFileSync(f,x,"utf8");c++;}console.log("Writing files...");
w('next.config.ts',`import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", typescript: { ignoreBuildErrors: false }, reactStrictMode: true };
export default nextConfig;
`);
w('vercel.json',JSON.stringify({"$schema":"https://openapi.vercel.sh/vercel.json",framework:"nextjs",headers:[{source:"/(.*)",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"X-Frame-Options",value:"DENY"},{key:"X-XSS-Protection",value:"1; mode=block"}]}]},null,2));
