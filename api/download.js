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
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: instagramUrl
      })
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("SoClip returned non-JSON:", responseText);

      return res.status(502).json({
        success: false,
        error: "SoClip returned an invalid response",
        status: response.status
      });
    }

    if (!response.ok) {
      console.error("SoClip HTTP error:", response.status, data);

      return res.status(502).json({
        success: false,
        error: data.error || data.message || "SoClip request failed",
        upstreamStatus: response.status
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("SoClip connection error:", error);

    return res.status(502).json({
      success: false,
      error: "Unable to connect to SoClip",
      details: error.message
    });
  }
}
