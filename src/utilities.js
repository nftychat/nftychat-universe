/**
 * Get ENS infomation resolved from the provided wallet address or ENS name
 * @param { string } - wallet address or ENS name
 * @returns { object } - { address, name, displayName, avatar }
 * @example getEnsInfo("0x8206a305Ad4dAb5117B5F1B7C200cD348d2b7a5D") returns { address: "0x...", displayName: "natt.eth" }
 * @example getEnsInfo("natt.eth") // returns { address: "0x...", displayName: "natt.eth" }
 * @example getEnsInfo("0x6CFd4180D5bFBFA467213e10e268B488F68e0460") // returns { address: "0x...", displayName: "0x..." } because not resolved to an ENS name
 */
export async function getDisplayName(param) {
  // Caching system
  // 1. Gets cached data and returns cached data if matched
  let sessionCache = sessionStorage.getItem("display_name_session_cache");
  let sessionCacheSerialize = {};
  if (sessionCache !== null) {
    sessionCacheSerialize = JSON.parse(sessionCache);
    const cacheData = sessionCacheSerialize[param];
    if (cacheData !== undefined) {
	    return truncateEns(cacheData['displayName'], 18);
    }
  }

  // Fetches data if not in cache
  const url = `https://api.ensideas.com/ens/resolve/${param}`;
  const response = await fetch(url);
  const data = await response.json();

  // Caching system
  // 2. Set cache data
  sessionCacheSerialize[param] = data;
  sessionStorage.setItem(
    "display_name_session_cache",
    JSON.stringify(sessionCacheSerialize)
  );

  return truncateEns(data['displayName'], 18);
}

// Make sure ens is short on page
function truncateEns(str, max_length){
  let ens;
  let left;
  let right;
  let letters_to_remove;

  if (str.length >= max_length) {
    letters_to_remove = Math.floor((str.length - max_length) / 2);
    left = str.substring(0, Math.floor(str.length / 2 - letters_to_remove));
    right = str.substring(
      Math.floor(str.length / 2) + letters_to_remove,
      str.length
    );
    ens = left + "..." + right;
  } else {
    ens = str;
  }
  return ens;
};

export const shortenAddress = (address) => {
  return address.slice(0, 6) + "..." + address.slice(-4);
};

export function formatDmMessage(message) {
  let tempMessage = message;
  if (tempMessage.length > 80) {
    tempMessage = message.substring(0, 40) + "...";
  }
  return tempMessage;
}