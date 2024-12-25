# PostNutClarity

PostNutClarity (PNC) is a JavaScript utility that provides encryption and decryption functionalities for text messages and binary files shared in a web application. It automatically encrypts outgoing messages and files, decrypts incoming messages, and offers a user-friendly interface for file uploads with encryption.
## Features
- Automatic message encryption and decryption
- [BETA] File encryption with automatic file decryption
- Simple GUI to toggle encryption/decryption
## Screenshots
<sub>With PNC:</sub>\
![imagea](https://github.com/user-attachments/assets/48130adb-0406-4af4-b0b1-058e23b4f51a)\
<sub>Without PNC:</sub>\
![image](https://github.com/user-attachments/assets/7acf97c5-4dcb-40e7-a500-de129889406e)\
\
<sub>Encrypted image with PNC:</sub>\
![image](https://github.com/user-attachments/assets/d110f1b0-953a-4c94-ba0d-b8feef054c71)\
<sub>Encrypted file with PNC:</sub>\
![image](https://github.com/user-attachments/assets/13b8055d-83ee-407e-9557-f1775c187bc2)\
<sub>Encrypted image/file without PNC:</sub>\
![image](https://github.com/user-attachments/assets/6556af13-c6c8-461e-b49d-980a4860e082)


## How to Run

### DevTools method
1. Open up DevTools using CTRL+SHIFT+I on https://discord.com/app (or the Discord app if you have it enabled)
2. Open the "Console" tab
3. Open [pnc.js](https://github.com/FTG2085/postnutclarity/blob/main/pnc.js) and copy the code
4. Paste the code into your console, and PNC should be enabled!
   > Note: As of now, you have to run this code every single time you open Discord

## How It Works

- **Message Encryption/Decryption**: Messages are encrypted before being sent and decrypted upon being received.
- **File Encryption/Decryption**: Files are encrypted before being uploaded and decrypted upon being displayed or downloaded.
- **MutationObserver**: Observes the DOM for changes and decrypts new content as it appears.
- **XHR Interception**: Intercepts outgoing XMLHttpRequest (XHR) requests to encrypt message content.
