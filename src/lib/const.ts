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
    "name": "RUNE•MOON•DRAGON",
    "requiredBalance": 2000000,
    "dashboardPath": "/dashboards/moon-dragon",
    "description": "Access Moon Dragon Dashboard"
  },
  {
    "name": "DOG•GO•TO•THE•MOON",
    "requiredBalance": 50000,
    "dashboardPath": "/dashboards/dog-go-to-the-moon",
    "description": "Access Dog Go To The Moon Dashboard"
  },
  {
    "name": "YOLO•MOON•RUNES",
    "requiredBalance": 400000,
    "dashboardPath": "/dashboards/yolo-moon-runes",
    "description": "Access YOLO•MOON•RUNES Dashboard"
  }
]; 