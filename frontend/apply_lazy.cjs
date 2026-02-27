const fs = require('fs');

const appTsxPath = './src/App.tsx';
let content = fs.readFileSync(appTsxPath, 'utf8');

content = content.replace(/import (\w+) from "(\.\/(pages|layouts)\/[^"]+)";/g, 'const $1 = lazy(() => import("$2"));');
content = content.replace(/import (\w+) from "@\/(pages|layouts)\/([^"]+)";/g, 'const $1 = lazy(() => import("@/$2/$3"));');

// Add Suspense and lazy import
if (!content.includes('{ lazy, Suspense }')) {
    content = content.replace(/import { useEffect } from "react";/, 'import { useEffect, lazy, Suspense } from "react";');
}

// Wrap Routes with Suspense
if (!content.includes('<Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>')) {
    content = content.replace(/<Routes>/, '<Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>\n            <Routes>');
    content = content.replace(/<\/Routes>/, '</Routes>\n            </Suspense>');
}

fs.writeFileSync(appTsxPath, content);
console.log('Lazy loading applied to App.tsx');
