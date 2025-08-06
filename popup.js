const SUPABASE_URL = 'https://aofvzgqksbhgljzowyby.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZnZ6Z3Frc2JoZ2xqem93eWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzAxMTEsImV4cCI6MjA3MDAwNjExMX0.XA4xgMqrMy9finlY9xvOhPdrQIsKYlRGmrNx_1D6db4';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => resolve(result[key]));
        });
      },
      setItem: (key, value) => {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => resolve());
        });
      },
      removeItem: (key) => {
        return new Promise((resolve) => {
          chrome.storage.local.remove([key], () => resolve());
        });
      }
    },
    autoRefreshToken: false
  }
});

console.log("Supabase initialized:", supabase);

document.getElementById('googleSignInBtn').addEventListener('click', signInWithGoogle);

let lastNonce = null; // Store nonce for later use

async function signInWithGoogle() {
  const clientId = '1043893440912-rbtkrg0isneoa112efm4621pmeus3qll.apps.googleusercontent.com'; // Replace with your Google OAuth Client ID
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/redirect`;
  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).substring(2);
  const nonce = state; // Use state as nonce for consistency
  lastNonce = nonce;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token id_token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=select_account&state=${state}&nonce=${nonce}`;

  
  chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  }, async (responseUrl) => {
    if (chrome.runtime.lastError || !responseUrl) {
      console.error('Authentication failed:', chrome.runtime.lastError);
      return;
    }

    // Parse the id_token from the response URL
    const hashParams = new URL(responseUrl).hash.substring(1);
    const params = new URLSearchParams(hashParams);

    const id_token = params.get('id_token');
    const payload = JSON.parse(atob(id_token.split('.')[1]));
console.log('aud in id_token:', payload.aud);
    if (!id_token) {
      console.error('No id_token found in response');
      return;
    }

    // Optional: Debug nonce in id_token
    try {
      const payload = JSON.parse(atob(id_token.split('.')[1]));
      console.log('Nonce in id_token:', payload.nonce);
      console.log('Nonce used:', lastNonce);
    } catch (e) {
      console.warn('Could not decode id_token payload for nonce check.');
    }

    // Pass the stored nonce as an argument
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
      nonce: lastNonce
    });

    if (error) {
      console.error('Supabase signInWithIdToken error:', error);
      return;
    }

    const { user } = data;
    console.log('User signed in:', user);
  });
}