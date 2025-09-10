export const config = {
  // AO Network Configuration
  aoProcessId: 'YeMnYYIOVq4A4GoH0CD-f7Y8Xv-LVAQBML8P-nQ1Xh8',
  
  // APUS HyperBEAM Node Configuration
  apusHyperbeamNodeUrl: 'http://72.46.85.207:8734',
  
  // Gateway API Configuration
  gatewayApiUrl: 'http://localhost:8787',
  
  // App Configuration
  appName: 'AOMemory',
  appLogo: undefined,
  
  // Attestation Configuration
  defaultAttestedBy: ['NVIDIA', 'AMD'],
  
  // UI Configuration
  theme: {
    accent: { r: 9, g: 29, b: 255 },
  },
  
  // Wallet Configuration
  walletPermissions: ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'] as const,
  ensurePermissions: true,
} as const; 