const fs = require('fs');
const path = require('path');

function fixImports(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace types imports
  content = content.replace(/import\s+{([^}]*)}\s+from\s+(['"])(.*types)(['"])/g, (match, p1, p2, p3, p4) => {
    return `import type { ${p1} } from ${p2}${p3}${p4}`;
  });

  // Remove `import React from 'react';`
  content = content.replace(/import React from 'react';?\n/g, '');
  
  // Replace `import React, { ... } from 'react';`
  content = content.replace(/import React,\s*{([^}]*)}\s*from 'react';?/g, "import { $1 } from 'react';");
  
  if (filePath.includes('AuthContext.tsx')) {
    // We already removed React. ReactNode is still in there: `import { createContext, useContext, useEffect, useState, ReactNode } from 'react';`
    content = content.replace(/ReactNode/g, '');
    content = content.replace(/,\s*,/g, ','); // cleanup comma
    content = content.replace(/{\s*,/g, '{'); 
    content = `import type { ReactNode } from 'react';\n` + content;
  }
  
  // Specific unused imports
  if (filePath.includes('Sidebar.tsx')) {
     content = content.replace(/MapPin,\s*/, '');
  }
  if (filePath.includes('AdminDashboard.tsx')) {
     content = content.replace(/CheckCircle,\s*/, '');
  }
  if (filePath.includes('VolunteerDashboard.tsx')) {
     content = content.replace(/ArrowRight,\s*/, '');
  }
  if (filePath.includes('DonationDetail.tsx')) {
     content = content.replace(/AlertCircle,\s*/, '');
  }
  if (filePath.includes('PickupsPage.tsx')) {
     content = content.replace(/Search,\s*/, '');
     content = content.replace(/Package,\s*/, '');
     content = content.replace(/import { ngoService } from '\.\.\/\.\.\/services\/ngoService';\n/, '');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'src/services/donationService.ts',
  'src/services/ngoService.ts',
  'src/services/statsService.ts',
  'src/services/volunteerService.ts',
  'src/context/NotificationContext.tsx',
  'src/context/AuthContext.tsx',
  'src/pages/dashboard/AdminDashboard.tsx',
  'src/pages/dashboard/DonorDashboard.tsx',
  'src/pages/dashboard/NGODashboard.tsx',
  'src/pages/dashboard/VolunteerDashboard.tsx',
  'src/pages/donations/DonationDetail.tsx',
  'src/pages/donations/DonationsPage.tsx',
  'src/pages/pickups/PickupsPage.tsx',
  'src/components/layout/AppLayout.tsx',
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Sidebar.tsx'
];

files.forEach(f => fixImports(path.join('d:/SmartF', f)));
console.log("Fixes applied!");
