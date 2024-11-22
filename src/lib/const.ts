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
    "name": "UNCOMMON•GOODS",
    "requiredBalance": 5,
    "dashboardPath": "/dashboards/uncommon-goods",
    "description": "Access Uncommon Goods Dashboard"
  },
  {
    "name": "RUNE•MOON•DRAGON",
    "requiredBalance": 2000000,
    "dashboardPath": "/dashboards/moon-dragon",
    "description": "Access Moon Dragon Dashboard"
  },
  {
    "name": "YOLO•MOON•RUNES",
    "requiredBalance": 400000,
    "dashboardPath": "/dashboards/yolo-moon-runes",
    "description": "Access YOLO•MOON•RUNES Dashboard"
  }
]; 