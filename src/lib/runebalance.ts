import axios from "axios";

export type RuneBalance = {
  name: string;
  balance: string;
  symbol: string;
};

export const fetchOrdAddress = async (address: string) => {
  try {
    const response = await axios.post("https://mainnet.sandshrew.io/v2/lasereyes", {
      jsonrpc: "2.0",
      method: "ord_address",
      params: [address],
      id: 1,
    });

    const runesData = response.data.result.runes_balances;

    return runesData.map((rune: any) => ({
      name: rune[0],
      balance: rune[1],
      symbol: rune[2],
    })) as RuneBalance[];
  } catch (error) {
    console.error("Error fetching ord address:", error);
    return [];
  }
};
