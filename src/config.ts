// Debug builds reach Metro and the API on the computer through localhost:
// iOS simulators share the host network; Android uses `adb reverse`
// (npm run android:reverse). Loopback avoids Android 17's local-network
// permission prompt, which a 10.0.2.2 address would trigger.
const DEV_API_URL = 'http://localhost:3000';

// shortcut: release builds point at a placeholder; set your deployed API URL before shipping.
const PROD_API_URL = 'https://api.arrowflow.example';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
