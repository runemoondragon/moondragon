import axios from "axios";

export type RuneBalance = {
  name: string;
  balance: string;
  symbol: string;
};

export const fetchOrdAddress = async (address: string) => {
  try {
    console.log("Fetching balance for address:", address);
    
    const response = await axios.post("https://mainnet.sandshrew.io/v2/lasereyes", {
      jsonrpc: "2.0",
      method: "ord_address",
      params: [address],
      id: 1,
    });

    console.log("Raw API response:", response.data);

    const runesData = response.data.result.runes_balances;
    console.log("Parsed runes data:", runesData);

    const balances = runesData.map((rune: any) => ({
      name: rune[0],
      balance: rune[1],
      symbol: rune[2],
    }));
    
    console.log("Formatted balances:", balances);
    return balances;
  } catch (error) {
    console.error("Error fetching ord address:", error);
    console.error("Error details:", {
      message: (error as Error).message,
      response: (error as any).response?.data
    });
    return [];
  }
};
