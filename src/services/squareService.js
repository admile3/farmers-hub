export async function getSquareConnectUrl(uid) {
  if (!uid) {
    throw new Error("User ID is required.");
  }

  const response = await fetch(
    `/api/square-oauth-start?uid=${encodeURIComponent(uid)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Could not start Square connection.");
  }

  return data.authUrl;
}

export async function connectSquare(uid) {
  const authUrl = await getSquareConnectUrl(uid);

  if (!authUrl) {
    throw new Error("No Square authorization URL was returned.");
  }

  window.location.href = authUrl;
}

export async function getSquareConnectionStatus(uid) {
  if (!uid) {
    return {
      connected: false
    };
  }

  const response = await fetch(
    `/api/square-connection-status?uid=${encodeURIComponent(uid)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Could not check Square connection.");
  }

  return data;
}

export async function importSquareSales({ uid, startDate, endDate }) {
  if (!uid) {
    throw new Error("User ID is required.");
  }

  const response = await fetch("/api/square-import-sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      uid,
      startDate,
      endDate
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Square import failed.");
  }

  return data;
}
