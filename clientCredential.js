const express = require("express");
const {Issuer} = require("openid-client");
const router = express.Router();
const fs = require("fs");

// Setup client using environment variables for issuer URL and client credentials
let client;
async function setupClient() {
  const issuer = await Issuer.discover(process.env.ISSUER_URL); // Ensure your environment variable is correctly named (process.env.ISSUER_URL)
  client = new issuer.Client({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    // No redirect URIs or response types needed for client credentials flow
  });
}
setupClient().catch(console.error);

router.get("/get-token", async (req, res) => {
  try {
    // Using the client credentials grant to obtain a token
    const tokenSet = await client.grant({
      grant_type: "client_credentials",
      // Optional: Specify the scope of access you're requesting
      scope: "your_scope_here",
    });

    // Optionally save token details in session or another store for later use
    // req.session.tokenSet = tokenSet; // Be cautious about what you store in sessions

    // Prepare and send the HTML response with token details
    const filePath = "./public/page.html";
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return res.status(500).send("An error occurred");
      }

      // Replace placeholders in your HTML file with token details
      let result = data.replace("{{oauth-flow}}", "Client Credentials Flow");
      result = result.replace(
        "{{authorize-detail}}",
        `   <h3>Token Details</h3>
            <p><strong>Access Token:</strong> ${tokenSet.access_token}</p>
            <p><strong>Token Type:</strong> ${tokenSet.token_type}</p>
            <p><strong>Expires In:</strong> ${tokenSet.expires_in} seconds</p>
            <p><strong>Scope:</strong> ${tokenSet.scope}</p>`
      );
      // Send the modified HTML to the client
      res.send(result);
    });
  } catch (error) {
    console.error("Error during client credentials flow:", error);
    res.status(500).send("Failed to obtain token");
  }
});

module.exports = router;
