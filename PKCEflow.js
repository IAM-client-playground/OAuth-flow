const express = require("express");
const {Issuer, generators} = require("openid-client");
const router = express.Router();
const fs = require("fs");

router.use(
  express.session({
    secret: "your_secret",
    resave: false,
    saveUninitialized: true,
  })
);

const redirectUri = "http://localhost:3000/pkce/callback";

let client;
async function setupClient() {
  const issuer = await Issuer.discover(process.Env.ISSUER_URL);
  client = new issuer.Client({
    client_id: process.env.CLIENT_ID,

    redirect_uris: [redirectUri],
    response_types: ["code"],
  });
}
setupClient().catch(console.error);

router.get("/login", async (req, res) => {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  const params = {
    scope: "openid email profile",
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  };
  const authUrl = client.authorizationUrl(params);

  // Save the auth request details in the session. Should not expose client_secret to the client.
  req.session.authRequestDetails = {
    authUrl: authUrl,
    params: params,
    codeVerifier: codeVerifier,
  };

  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(redirectUri, params, {
    code_verifier: req.session.authRequestDetails.codeVerifier,
  });
  const authCode = params;
  const accessToken = tokenSet.access_token;
  const scopes = tokenSet.scope;

  const authRequestDetails = req.session.authRequestDetails;
  const filePath = "./public/page.html";
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    const result = data.replace("{{oauth-flow}}", "PKCE Flow");
    result = result.replace(
      "{{authorize-detail}}",
      `     <h3>Authorization Request Details</h3>
                <p><strong>Authorization URL:</strong> ${
                  authRequestDetails.authUrl
                }</p>
                <p><strong>Parameters:</strong> ${JSON.stringify(
                  authRequestDetails.params,
                  null,
                  2
                )}</p>

                <h3>Callback Response</h3>
                <p><strong>Authorization Code:</strong> ${authCode}</p>
                <p><strong>Access Token:</strong> ${accessToken}</p>
                <p><strong>ID Token:</strong> ${tokenSet.id_token}</p>
                <p><strong>Scopes:</strong> ${scopes}</p>`
    );
    // Send the modified HTML to the client
    res.send(result);
  });
});

module.exports = router;
