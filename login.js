// 🔑 YOUR CLIENT ID
const CLIENT_ID = "222902625901-4jogf2o0d677km1nnctjtarp1pejr9s8.apps.googleusercontent.com";

// MUST be global (window.)
window.handleGoogleLogin = function (response) {
  const payload = JSON.parse(atob(response.credential.split(".")[1]));

  const user = {
    name: payload.name,
    email: payload.email,
    picture: payload.picture
  };

  localStorage.setItem("kasatria_user", JSON.stringify(user));

  // Redirect after login
  window.location.href = "index.html";
};

// Wait until Google script is ready
function initGoogleLogin() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    setTimeout(initGoogleLogin, 200);
    return;
  }

  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: window.handleGoogleLogin
  });

  google.accounts.id.renderButton(
    document.getElementById("google-btn"),
    {
      theme: "filled_black",  // Changed from "outline" to blend better
      size: "large",
      width: 280,
      text: "signin_with",
      shape: "rectangular",
      logo_alignment: "center"
    }
  );
}

// Alternative: Custom button trigger (use if you uncomment the custom button in HTML)
function googleSignIn() {
  google.accounts.id.prompt();
}

// Start
initGoogleLogin();
