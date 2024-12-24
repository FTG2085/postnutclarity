(function () {
    const originalXHR = window.XMLHttpRequest;
    let encryptionEnabled = true;
    let decryptionEnabled = true;

    // Encryption and Decryption Functions
    function encryptMessage(message) {
        return `PNC${Array.from(message).map((char) => String.fromCharCode(char.charCodeAt(0) + 500)).join('')}`;
    }

    function decryptMessage(message) {
        if (!message.startsWith("PNC")) return message;
        const encryptedPart = message.slice(3);
        return Array.from(encryptedPart).map((char) => String.fromCharCode(char.charCodeAt(0) - 500)).join('');
    }

    // Monitor XMLHttpRequest for Encryption
    function monitorXHR() {
        const open = originalXHR.prototype.open;
        const send = originalXHR.prototype.send;

        originalXHR.prototype.open = function (method, url) {
            this._url = url;
            open.apply(this, arguments);
        };

        originalXHR.prototype.send = function (body) {
            if (this._url?.includes('/messages') && body && encryptionEnabled) {
                try {
                    const parsedBody = JSON.parse(body);
                    if (parsedBody?.content) {
                        parsedBody.content = encryptMessage(parsedBody.content);
                        body = JSON.stringify(parsedBody);
                    }
                } catch (error) {
                    console.error('[XHR Encryption Error]', error);
                }
            }
            send.call(this, body);
        };
    }

    // Monitor DOM for Decryption with MutationObserver
    function monitorDecryption() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        decryptTextNode(node);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        node.querySelectorAll('*').forEach(decryptTextNode);
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Decrypt Text Nodes
    function decryptTextNode(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue.startsWith("PNC") && decryptionEnabled) {
            const decrypted = decryptMessage(node.nodeValue);
            if (decrypted) node.nodeValue = decrypted;
        }
    }

    // Create GUI for Encryption/Decryption Toggle
    function createGUI() {
        const gui = document.createElement('div');
        gui.style.position = 'fixed';
        gui.style.bottom = '10px';
        gui.style.right = '10px';
        gui.style.background = 'rgba(0, 0, 0, 0.8)';
        gui.style.color = 'white';
        gui.style.padding = '10px';
        gui.style.borderRadius = '5px';
        gui.style.zIndex = '9999';
        gui.style.fontFamily = 'Arial, sans-serif';
        gui.innerHTML = `
            <div style="margin-bottom: 5px; font-weight: bold;">PostNutClarity by FTG2085</div>
            <label>
                <input type="checkbox" id="encryptionToggle" checked />
                Enable Encryption
            </label>
            <br />
            <label>
                <input type="checkbox" id="decryptionToggle" checked />
                Enable Decryption
            </label>
        `;
        document.body.appendChild(gui);

        const encryptionToggle = document.getElementById('encryptionToggle');
        const decryptionToggle = document.getElementById('decryptionToggle');

        encryptionToggle.addEventListener('change', () => {
            encryptionEnabled = encryptionToggle.checked;
            console.log(`[GUI] Encryption Enabled: ${encryptionEnabled}`);
        });

        decryptionToggle.addEventListener('change', () => {
            decryptionEnabled = decryptionToggle.checked;
            console.log(`[GUI] Decryption Enabled: ${decryptionEnabled}`);
        });
    }

    // Initialize
    monitorXHR();
    monitorDecryption();
    createGUI();

    console.log('%c[PostNutClarity]', 'color: aqua; font-weight: bold;', 'ACTIVATED!');
})();
