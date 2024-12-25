// =======================================
// PostNutClarity v1.1.0
// by FTG2085
// - Automatic message encryption/decryption
// - BETA file encryption with automatic file decryption
// =======================================

(function() {
    let encryptionEnabled = true;
    let decryptionEnabled = true;

    // ------------------------------------------------
    // 1. Utility: Determine if file is an image by type
    // ------------------------------------------------
    function isImageType(encryptionPrefix) {
        return encryptionPrefix.startsWith("PNC-FILE-IMAGE");
    }

    // ------------------------------
    // 2. Text Encryption/Decryption
    // ------------------------------
    function encryptMessage(message) {
        const encrypted = Array.from(message)
            .map((char) => String.fromCharCode(char.charCodeAt(0) + 500))
            .join('');
        return `PNC${encrypted}`;
    }

    function decryptMessage(message) {
        if (!message.startsWith("PNC")) return null;
        const encryptedPart = message.slice(3);
        return Array.from(encryptedPart)
            .map((char) => String.fromCharCode(char.charCodeAt(0) - 500))
            .join('');
    }

    // ----------------------------------
    // 3. File Encryption/Decryption
    // ----------------------------------
    function encryptBinaryData(data, isImage) {
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
        const encrypted = Array.from(base64)
            .map((char) => String.fromCharCode(char.charCodeAt(0) + 500))
            .join('');
        return isImage ? `PNC-FILE-IMAGE${encrypted}` : `PNC-FILE-NOIMAGE${encrypted}`;
    }

    function decryptBinaryData(encrypted) {
        if (
            !encrypted.startsWith("PNC-FILE-IMAGE") &&
            !encrypted.startsWith("PNC-FILE-NOIMAGE")
        ) {
            return null;
        }
        let slicePoint = encrypted.startsWith("PNC-FILE-IMAGE")
            ? "PNC-FILE-IMAGE".length
            : "PNC-FILE-NOIMAGE".length;
        const encodedData = encrypted.slice(slicePoint);

        const shifted = Array.from(encodedData)
            .map((char) => String.fromCharCode(char.charCodeAt(0) - 500))
            .join('');

        try {
            const binaryString = atob(shifted);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes;
        } catch {
            return null;
        }
    }

    // -----------------------------------------------------------
    // 4. Inline Replacement or Fallback for Decrypted Files
    // -----------------------------------------------------------
    function replaceNodeWithFilePreview(node, decryptedBytes, isImage) {
        const parentNode = node.parentNode;
        if (!parentNode) return;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-block';
        wrapper.style.marginLeft = '5px';

        if (isImage) {
            const blob = new Blob([decryptedBytes], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const img = document.createElement('img');
            img.src = url;
            img.style.maxWidth = '200px';
            img.style.display = 'block';
            wrapper.appendChild(img);
        } else {
            const noPreview = document.createElement('div');
            noPreview.textContent = 'Cannot render preview.';
            noPreview.style.color = 'gray';
            noPreview.style.fontStyle = 'italic';
            wrapper.appendChild(noPreview);
        }

        const downloadBtn = document.createElement('button');
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.style.alignItems = 'center';
        downloadBtn.style.marginTop = '5px';

        const svgIcon = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svgIcon.setAttribute('width','16');
        svgIcon.setAttribute('height','16');
        svgIcon.setAttribute('viewBox','0 0 24 24');
        svgIcon.style.fill = 'currentColor';
        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d','M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2 13h-4v-4H7l5-5 5 5h-3v4z');
        svgIcon.appendChild(path);

        downloadBtn.style.backgroundColor = '#7289da';
        downloadBtn.style.border = 'none';
        downloadBtn.style.color = 'white';
        downloadBtn.style.padding = '6px 8px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.borderRadius = '4px';
        downloadBtn.style.marginRight = '5px';

        downloadBtn.appendChild(svgIcon);

        const label = document.createElement('span');
        label.textContent = ' Download';
        label.style.marginLeft = '3px';
        downloadBtn.appendChild(label);

        downloadBtn.addEventListener('click', () => {
            const blob = new Blob([decryptedBytes]);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = isImage ? 'PNC_image.png' : 'PNC_file.bin';
            anchor.click();
        });

        wrapper.appendChild(downloadBtn);

        parentNode.replaceChild(wrapper, node);
    }

    // --------------------------------------------------------------
    // 5. Observe DOM with MutationObserver for Fast Decryption
    // --------------------------------------------------------------
    function processNodeDecryption(node) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
            const text = node.nodeValue.trim();
            if (decryptionEnabled) {
                if (text.startsWith("PNC-FILE-IMAGE") || text.startsWith("PNC-FILE-NOIMAGE")) {
                    const fileBytes = decryptBinaryData(text);
                    if (fileBytes) {
                        const imageType = isImageType(text);
                        replaceNodeWithFilePreview(node, fileBytes, imageType);
                    }
                } else if (text.startsWith("PNC")) {
                    const decryptedContent = decryptMessage(text);
                    if (decryptedContent && text !== decryptedContent) {
                        node.nodeValue = decryptedContent;
                    }
                }
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.closest('.channelBottomBarArea_a7d72e')) {
                // Skip nodes inside the specified class
                return;
            }
            Array.from(node.childNodes).forEach(processNodeDecryption);
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes?.forEach((addedNode) => processNodeDecryption(addedNode));
        }
    });

    processNodeDecryption(document.body);
    observer.observe(document.body, { childList: true, subtree: true });

    // -------------------------------------
    // 6. XHR Hook for Outgoing Message Text
    // -------------------------------------
    const originalXHR = window.XMLHttpRequest;
    function monitorXHR() {
        const origOpen = originalXHR.prototype.open;
        const origSend = originalXHR.prototype.send;

        originalXHR.prototype.open = function(method, url) {
            this._url = url;
            return origOpen.apply(this, arguments);
        };

        originalXHR.prototype.send = function(body) {
            if (this._url?.includes('/messages') && body && encryptionEnabled) {
                try {
                    const parsedBody = JSON.parse(body);
                    if (parsedBody?.content) {
                        parsedBody.content = encryptMessage(parsedBody.content);
                        body = JSON.stringify(parsedBody);
                    }
                } catch {}
            }
            return origSend.call(this, body);
        };
    }

    // -----------------------
    // 7. File Upload Dialog
    // -----------------------
    function guessIsImage(file) {
        const lowerName = file.name.toLowerCase();
        return (
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.jpeg') ||
            lowerName.endsWith('.gif') ||
            lowerName.endsWith('.webp')
        );
    }

    function createPNCFileUploadGUI() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.flexDirection = 'column';

        const container = document.createElement('div');
        container.style.background = 'white';
        container.style.color = 'black';
        container.style.padding = '20px';
        container.style.borderRadius = '6px';
        container.style.textAlign = 'center';
        container.style.minWidth = '300px';

        const title = document.createElement('h2');
        title.style.marginTop = '0';
        title.textContent = 'PNC File Upload';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'block';
        fileInput.style.margin = '10px auto';

        const encryptedContentArea = document.createElement('textarea');
        encryptedContentArea.style.width = '100%';
        encryptedContentArea.style.height = '100px';
        encryptedContentArea.style.display = 'none';
        encryptedContentArea.readOnly = true;

        const encryptBtn = document.createElement('button');
        encryptBtn.textContent = 'Encrypt';
        encryptBtn.style.marginTop = '10px';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.marginLeft = '10px';
        closeBtn.style.marginTop = '10px';

        container.appendChild(title);
        container.appendChild(fileInput);
        container.appendChild(encryptedContentArea);
        container.appendChild(encryptBtn);
        container.appendChild(closeBtn);
        overlay.appendChild(container);

        document.body.appendChild(overlay);

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        encryptBtn.addEventListener('click', async () => {
            if (!fileInput.files?.length) {
                alert('No file selected!');
                return;
            }
            try {
                const file = fileInput.files[0];
                const data = await file.arrayBuffer();
                const isImg = guessIsImage(file);
                const encrypted = encryptBinaryData(data, isImg);
                encryptedContentArea.value = encrypted;
                encryptedContentArea.style.display = 'block';
            } catch (err) {
                console.error('[PNC] Encryption failed:', err);
            }
        });
    }

    // ---------------------------------
    // 8. Automatic Hook for File Upload
    // ---------------------------------
    function overrideUploadElement() {
        const btn = document.getElementById('channel-attach-upload-file');
        if (btn && !btn._pncOverridden) {
            btn._pncOverridden = true;
            btn.onclick = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                createPNCFileUploadGUI();
            };
        }
    }

    // ---------------------------------
    // 9. Simple Toggles for Debug
    // ---------------------------------
    function createToggles() {
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
        gui.style.minWidth = '150px';

        const encLabel = document.createElement('label');
        const encCheckbox = document.createElement('input');
        encCheckbox.type = 'checkbox';
        encCheckbox.checked = encryptionEnabled;
        encLabel.appendChild(encCheckbox);
        encLabel.appendChild(document.createTextNode(' Enable Encryption'));
        encLabel.style.display = 'block';
        encLabel.style.marginBottom = '5px';

        const decLabel = document.createElement('label');
        const decCheckbox = document.createElement('input');
        decCheckbox.type = 'checkbox';
        decCheckbox.checked = decryptionEnabled;
        decLabel.appendChild(decCheckbox);
        decLabel.appendChild(document.createTextNode(' Enable Decryption'));
        decLabel.style.display = 'block';
        decLabel.style.marginBottom = '5px';

        gui.appendChild(encLabel);
        gui.appendChild(decLabel);
        document.body.appendChild(gui);

        encCheckbox.addEventListener('change', () => {
            encryptionEnabled = encCheckbox.checked;
        });
        decCheckbox.addEventListener('change', () => {
            decryptionEnabled = decCheckbox.checked;
        });
    }

    // ---------------------------------
    // 10. Initialization
    // ---------------------------------
    function init() {
        monitorXHR();
        createToggles();
        setInterval(overrideUploadElement, 500);
        console.log('[PNC] v1.1.0: Activated');
    }

    init();
})();
