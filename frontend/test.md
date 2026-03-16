To test your P2P File Sharing app on two different devices (like your laptop and a phone, or two different computers), follow these steps.

Since WebRTC requires a "Signaling Server" (your Spring Boot backend) to help the devices find each other, both devices must be able to talk to your computer.

### Method 1: Local Network (Same Wi-Fi) 🌐

This is the easiest way to test while developing.

#### 1. Find your Local IP Address

On your computer (where the code is running):

- Open **Command Prompt**.
- Type `ipconfig` and press Enter.
- Your IP is: **10.65.189.120**

#### 2. Update the Frontend Connection

Ensure your frontend is trying to connect to your IP, not localhost.

- **Update:** I have already updated `frontend/js/config.js` to use `ws://10.65.189.120:8080/api/ws`.

#### 3. Access on Device A (Host)

- Open your browser and go to `http://localhost:5500` (or `http://10.65.189.120:5500`).
- Create a room.

#### 4. Access on Device B (Receiver)

- On your second device (phone/laptop), open the browser.
- Enter `http://10.65.189.120:5500` in the address bar.
- Enter the Room Code and join.

---

### ⚠️ Important: Browser Security (HTTPS)

WebRTC APIs are often restricted to **Secure Contexts** (HTTPS).

- **On your computer:** `http://localhost` is treated as secure, so it works fine.
- **On other devices:** Browsers block WebRTC on `http://` sites (except localhost).

**The Workaround (Chromium/Android only):**

1.  Open Chrome on the second device (phone).
2.  Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`.
3.  Add `http://10.65.189.120:5500` to the text area.
4.  Set the dropdown to **Enabled**.
5.  Relaunch Chrome.

---

### Summary Checklist for Success:

- ✅ **Backend Running:** Make sure your Spring Boot app is active on port 8080.
- ✅ **Frontend Running:** Ensure your web server is running on port 5500.
- ✅ **Same Wi-Fi:** Both devices must be on the same network.
- ✅ **Firewall:** Ensure Windows Firewall allows incoming connections on ports 8080 and 5500.
