export const BTC_MESSAGE_TO_SIGN = "RuneCheck Authentication";

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
    "requiredBalance": 1000000,
    "dashboardPath": "/dashboards/moon-dragon",
    "description": "Access Moon Dragon Dashboard"
  },
  {
    "name": "UNCOMMON•GOODS",
    "requiredBalance": 5,
    "dashboardPath": "/dashboards/uncommon-goods",
    "description": "Access UNCOMMON•GOODS Dashboard",
    "externalUrl": "/dashboards/uncommon-goods"
  },
  {
    "name": "YOLO•MOON•RUNES",
    "requiredBalance": 400000,
    "dashboardPath": "/dashboards/yolo-moon-runes",
    "description": "Access YOLO•MOON•RUNES Dashboard"
  },
  {
    "name": "MAGA•FIGHT•FIGHT",
    "requiredBalance": 10000,
    "dashboardPath": "/dashboards/maga-fight-fight",
    "description": "Access MAGA•FIGHT•FIGHT Dashboard",
    "externalUrl": "/dashboards/maga-fight-fight"
  }
]; 