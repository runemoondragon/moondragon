export const BTC_MESSAGE_TO_SIGN = "BitboardDash Authentication";

export interface AccessToken {
  name: string;
  requiredBalance: number;
  dashboardPath: string;
  description: string;
  externalUrl?: string;
}

export const ACCESS_TOKENS: AccessToken[] = [
  {
    "name": "BITBOARD•DASH",
    "requiredBalance": 200000,
    "dashboardPath": "/dashboards/moon-dragon",
    "description": "Access Moon Dragon Dashboard"
  }
]; 