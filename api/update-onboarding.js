export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId } = req.body;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VITE_CLERK_SECRET}`,
      },
      body: JSON.stringify({
        public_metadata: {
          isOnboarded: true,
          userLevel: "basic",
        },
      }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
