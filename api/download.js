export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const instagramUrl = req.query.url;

  if (!instagramUrl) {
    return res.status(400).json({
      success: false,
      error: "Instagram URL is required"
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(instagramUrl);
  } catch {
    return res.status(400).json({
      success: false,
      error: "Invalid Instagram URL"
    });
  }

  const allowedHosts = [
    "instagram.com",
    "www.instagram.com"
  ];

  if (!allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: "Only Instagram URLs are supported"
    });
  }

  const apiKey = process.env.SOCLIP_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "SOCLIP_API_KEY is not configured"
    });
  }

  try {
    const response = await fetch("https://api.soclip.dev/v1/media", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: instagramUrl
      })
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        error: "Invalid response from SoClip"
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error || data.message || "SoClip request failed"
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("SoClip error:", error);

    return res.status(500).json({
      success: false,
      error: "Unable to connect to SoClip"
    });
  }
}
