import { Platform } from 'react-native';

// Android emulators reach the host machine at 10.0.2.2; iOS simulators use localhost.
const DEV_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// shortcut: release builds point at a placeholder; set your deployed API URL before shipping.
const PROD_API_URL = 'https://api.arrowflow.example';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
