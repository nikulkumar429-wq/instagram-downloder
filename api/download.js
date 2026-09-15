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

  if (!allowedHosts.includes(parsedUrl.hostname)) {
    return res.status(400).json({
      success: false,
      error: "Only Instagram URLs are supported"
    });
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;

  if (!rapidApiKey) {
    return res.status(500).json({
      success: false,
      error: "RAPIDAPI_KEY is not configured on the server"
    });
  }

  const apiUrl =
    "https://instagram-reels-downloader-api.p.rapidapi.com/download?url=" +
    encodeURIComponent(instagramUrl);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host":
          "instagram-reels-downloader-api.p.rapidapi.com"
      }
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        success: false,
        error: "Invalid response from RapidAPI"
      };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "RapidAPI request failed",
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Unable to connect to RapidAPI"
    });
  }
}
