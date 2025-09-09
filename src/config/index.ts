export const config = {
  // AO Network Configuration
  aoProcessId: 'pqv5D0p8bmWfTG6oLRDzLlFl63QR29UOB8YOWFP5rIw',
  
  // APUS HyperBEAM Node Configuration
  apusHyperbeamNodeUrl: 'http://72.46.85.207:8734',
  
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