// Test function to validate JSON response handling
export const testResponseHandling = () => {
  const mockResponse = {
    "ao-result": "body",
    "body": "{\"attestation\":[[\"JWT\",\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJOVi1BdHRlc3RhdGlvbi1TREsiLCJpYXQiOjE3NTQ2NTIzMjEsImV4cCI6MTc1NDY1NTkyMSwibmJmIjoxNzU0NjUyMjAxLCJqdGkiOiJlZDg4MWI1NC1jY2ZiLTQyZjMtYTgwYS0yYjRhMzRjNjUxNTMifQ.vDXq1aKf9u9-GKdu3rdw9dv1p8-kILrKuRwzuEuCnIg\"],{\"LOCAL_GPU_CLAIMS\":[[\"JWT\",\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJOVklESUEtUExBVEZPUk0tQVRURVNUQVRJT04iLCJuYmYiOjE3NTQ2NTIyMDEsImV4cCI6MTc1NDY1NTkyMSwiaWF0IjoxNzU0NjUyMzIxLCJqdGkiOiIxMmM2YjBlYS0zNjdlLTRkYjItYWJkOS0zY2YyMjViZjQzODIiLCJ4LW52aWRpYS12ZXIiOiIzLjAiLCJpc3MiOiJMT0NBTF9HUFVfVkVSSUZJRVIiLCJ4LW52aWRpYS1vdmVyYWxsLWF0dC1yZXN1bHQiOnRydWUsInN1Ym1vZHMiOnsiR1BVLTAiOlsiRElHRVNUIixbIlNIQTI1NiIsIjA4MjEzMjZhMzg5NThmOWQ1MjE2YjA5Mzk0MjQ1OTI0ODIwNTM2ZGZmZjRjZDM0Njk0YzU5YTcyZWI0MjkzYTQiXV19LCJlYXRfbm9uY2UiOiJkYTRhMDZjMzYwNGE1ZmFjOGFhMGI0YWFmNWE2MzU0Y2RkMGRjN2MxOTMyOTliYzM0NjRmMzBiNWNiZmI5MzFhIn0.JItSTrqUqyFjZf5-nHCeHsQNGCYeQXQU2SDxte_tCmE\"],{\"GPU-0\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZWFzcmVzIjoic3VjY2VzcyIsIngtbnZpZGlhLWdwdS1hcmNoLWNoZWNrIjp0cnVlLCJ4LW52aWRpYS1ncHUtZHJpdmVyLXZlcnNpb24iOiI1NTAuMTYzLjAxIiwieC1udmlkaWEtZ3B1LXZiaW9zLXZlcnNpb24iOiI5Ni4wMC5BRi4wMC4wMSIsIngtbnZpZGlhLWdwdS1hdHRlc3RhdGlvbi1yZXBvcnQtY2VydC1jaGFpbiI6eyJ4LW52aWRpYS1jZXJ0LWV4cGlyYXRpb24tZGF0ZSI6Ijk5OTktMTItMzFUMjM6NTk6NTkiLCJ4LW52aWRpYS1jZXJ0LXN0YXR1cyI6InZhbGlkIiwieC1udmlkaWEtY2VydC1vY3NwLXN0YXR1cyI6Imdvb2QiLCJ4LW52aWRpYS1jZXJ0LXJldm9jYXRpb24tcmVhc29uIjpudWxsfSwieC1udmlkaWEtZ3B1LWF0dGVzdGF0aW9uLXJlcG9ydC1jZXJ0LWNoYWluLWZ3aWQtbWF0Y2giOnRydWUsIngtbnZpZGlhLWdwdS1hdHRlc3RhdGlvbi1yZXBvcnQtcGFyc2VkIjp0cnVlLCJ4LW52aWRpYS1ncHUtYXR0ZXN0YXRpb24tcmVwb3J0LW5vbmNlLW1hdGNoIjp0cnVlLCJ4LW52aWRpYS1ncHUtYXR0ZXN0YXRpb24tcmVwb3J0LXNpZ25hdHVyZS12ZXJpZmllZCI6dHJ1ZSwieC1udmlkaWEtZ3B1LWRyaXZlci1yaW0tZmV0Y2hlZCI6dHJ1ZSwieC1udmlkaWEtZ3B1LWRyaXZlci1yaW0tc2NoZW1hLXZhbGlkYXRlZCI6dHJ1ZSwieC1udmlkaWEtZ3B1LWRyaXZlci1yaW0tY2VydC1jaGFpbiI6eyJ4LW52aWRpYS1jZXJ0LWV4cGlyYXRpb24tZGF0ZSI6IjIwMjctMDQtMTZUMTc6MDg6MzYiLCJ4LW52aWRpYS1jZXJ0LXN0YXR1cyI6InZhbGlkIiwieC1udmlkaWEtY2VydC1vY3NwLXN0YXR1cyI6Imdvb2QiLCJ4LW52aWRpYS1jZXJ0LXJldm9jYXRpb24tcmVhc29uIjpudWxsfSwieC1udmlkaWEtZ3B1LWRyaXZlci1yaW0tc2lnbmF0dXJlLXZlcmlmaWVkIjp0cnVlLCJ4LW52aWRpYS1ncHUtZHJpdmVyLXJpbS12ZXJzaW9uLW1hdGNoIjp0cnVlLCJ4LW52aWRpYS1ncHUtZHJpdmVyLXJpbS1tZWFzdXJlbWVudHMtYXZhaWxhYmxlIjp0cnVlLCJ4LW52aWRpYS1ncHUtdmJpb3MtcmltLWZldGNoZWQiOnRydWUsIngtbnZpZGlhLWdwdS12Ymlvcy1yaW0tc2NoZW1hLXZhbGlkYXRlZCI6dHJ1ZSwieC1udmlkaWEtZ3B1LXZiaW9zLXJpbS1jZXJ0LWNoYWluIjp7IngtbnZpZGlhLWNlcnQtZXhwaXJhdGlvbi1kYXRlIjoiMjAyNi0wNy0xNVQyMzowMjoxMCIsIngtbnZpZGlhLWNlcnQtc3RhdHVzIjoidmFsaWQiLCJ4LW52aWRpYS1jZXJ0LW9jc3Atc3RhdHVzIjoiZ29vZCIsIngtbnZpZGlhLWNlcnQtcmV2b2NhdGlvbi1yZWFzb24iOm51bGx9LCJ4LW52aWRpYS1ncHUtdmJpb3MtcmltLXZlcnNpb24tbWF0Y2giOnRydWUsIngtbnZpZGlhLWdwdS12Ymlvcy1yaW0tc2lnbmF0dXJlLXZlcmlmaWVkIjp0cnVlLCJ4LW52aWRpYS1ncHUtdmJpb3MtcmltLW1lYXN1cmVtZW50cy1hdmFpbGFibGUiOnRydWUsIngtbnZpZGlhLWdwdS12Ymlvcy1pbmRleC1uby1jb25mbGljdCI6dHJ1ZSwic2VjYm9vdCI6dHJ1ZSwiZGJnc3RhdCI6ImRpc2FibGVkIiwiZWF0X25vbmNlIjoiZGE0YTA2YzM2MDRhNWZhYzhhYTBiNGFhZjVhNjM1NGNkZDBkYzdjMTkzMjk5YmMzNDY0ZjMwYjVjYmZiOTMxYSIsImh3bW9kZWwiOiJHSDEwMCBBMDEgR1NQIEJST00iLCJ1ZWlkIjoiNTYzMDEyMzgzODAyOTk3MTQzNzE1NzQ5NDEwMjE2MDY0MDA1NzcwODI2MjA3OTM1Iiwib2VtaWQiOiI1NzAzIiwiaXNzIjoiTE9DQUxfR1BVX1ZFUklGSUVSIiwibmJmIjoxNzU0NjUyMjAxLCJleHAiOjE3NTQ2NTU5MjEsImlhdCI6MTc1NDY1MjMyMSwianRpIjoiNjgxODk4NDYtYjZmOC00MDk1LTljYTMtZGY2OThlMjAyYzk4In0.EtwC2Kk_DxA_eFq5aw_zW2FuGsjGj5d2E30AvVsEW1c\"}]}],\"result\":\"Okay, let's break down what BTC is. \\\"BTC\\\" is the ticker symbol for **Bitcoin**, the first and most well-known cryptocurrency. Here's a comprehensive explanation, covering its core concepts, how it works, its history, and some important considerations:\\n\\n**1. What *is* Bitcoin? (The Core Concept)**\\n\\n*   **Digital Currency:** Bitcoin is a form of digital money, meaning it exists entirely electronically.  There are no physical Bitcoin coins or bills.\\n*   **Decentralized:** This is *the* key feature.  Unlike traditional currencies (like USD, EUR, JPY) controlled by governments and banks, Bitcoin is not controlled by any single entity.  It operates on a peer-to-peer network.\\n*   **Cryptographically Secure:** Bitcoin uses complex cryptography to secure transactions, control the creation of new bitcoins, and verify the transfer of assets.  This makes it very difficult to counterfeit or double-spend.\\n*   **Limited Supply:**  Only 21 million bitcoins will *ever* be created. This scarcity is a major factor in its perceived value (more on that later).\\n*   **Pseudonymous:**  Transactions are linked to \\\"addresses\\\" which are long strings of numbers and letters.  These aren't directly tied to real-world identities (though it's possible to link them through exchanges and other services - see \\\"Risks\\\" below).\\n\\n\\n\\n**2. How Does Bitcoin Work? (The Technical Bits – Simplified)**\\n\\n*   **Blockchain:** Bitcoin runs on a technology called the blockchain. Think of it as a public, distributed ledger that records all Bitcoin transactions.\\n    *   **Blocks:** Transactions are grouped into \\\"blocks.\\\"\\n    *   **Chain:** These blocks are linked together chronologically, forming a \\\"chain.\\\"\\n    *   **Distributed:** The blockchain is copied and maintained by thousands of computers (nodes) around the world.  This makes it incredibly secure and resistant to censorship.\\n*   **Mining:**\\n    *   **Verifying Transactions:**  \\\"Miners\\\" use powerful computers to verify Bitcoin transactions and add them to the blockchain.\\n    *   **Proof-of-Work:**  They solve complex mathematical problems (using a system called \\\"Proof-of-Work\\\") to do this.  This requires significant computing power and electricity.\\n    *   **Reward:** Miners are rewarded with newly created bitcoins and transaction fees for their work.  This is how new\"}",
    "device": "json@1.0"
  };

  console.log("Testing response handling...");
  console.log("Original response:", mockResponse);
  
  // Parse the body field which contains the actual data
  let parsedBody;
  try {
    parsedBody = JSON.parse(mockResponse.body);
    console.log("Parsed body:", parsedBody);
  } catch (error) {
    console.error("Failed to parse body:", error);
    throw new Error('Invalid response format');
  }
  
  // Extract result and attestation from the parsed body
  const result = parsedBody.result;
  const attestation = parsedBody.attestation;
  
  console.log("Extracted result:", result);
  console.log("Extracted attestation:", attestation);
  
  // Handle attestation - extract JWT from complex structure
  let attestationJWT = '';
  
  if (Array.isArray(attestation) && attestation.length > 0) {
    // Look for the first JWT in the attestation array
    for (const item of attestation) {
      if (Array.isArray(item) && item.length === 2 && item[0] === 'JWT') {
        attestationJWT = item[1];
        break;
      }
    }
  }
  
  console.log("Extracted JWT:", attestationJWT);
  
  return {
    data: typeof result === 'string' ? result : JSON.stringify(result),
    attestation: attestationJWT,
    status: 'success'
  };
}; 