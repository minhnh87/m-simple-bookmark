// Prompt Page Module - Handles prompt textarea and helper buttons with persistence

function initializePrompt() {
    const textarea = document.getElementById('prompt-textarea');
    const addVerificationBtn = document.getElementById('add-verification-text');
    const addImplementationBtn = document.getElementById('add-implementation-guide');
    const addCleanCodeBtn = document.getElementById('add-clean-code-reminder');
    const customInput1 = document.getElementById('custom-text-1-input');
    const customInput2 = document.getElementById('custom-text-2-input');
    const addCustom1Btn = document.getElementById('add-custom-text-1-btn');
    const addCustom2Btn = document.getElementById('add-custom-text-2-btn');
    const copyBtn = document.getElementById('copy-prompt-to-clipboard');
    const clearBtn = document.getElementById('clear-prompt-text');

    if (!textarea) return;

    // Load persisted custom inputs
    try {
        const saved1 = localStorage.getItem('promptCustomText1');
        const saved2 = localStorage.getItem('promptCustomText2');
        if (customInput1 && saved1 !== null) customInput1.value = saved1;
        if (customInput2 && saved2 !== null) customInput2.value = saved2;
    } catch (e) {
        console.warn('Unable to load custom prompt texts from localStorage');
    }

    // Persist on change
    if (customInput1) {
        customInput1.addEventListener('input', () => {
            try { localStorage.setItem('promptCustomText1', customInput1.value); } catch {}
        });
    }
    if (customInput2) {
        customInput2.addEventListener('input', () => {
            try { localStorage.setItem('promptCustomText2', customInput2.value); } catch {}
        });
    }

    function appendText(text) {
        if (!text || !textarea) return;
        const toAppend = String(text);
        const hasContent = textarea.value.trim().length > 0;
        textarea.value = hasContent ? (textarea.value + '\n' + toAppend) : toAppend;
        textarea.focus();
        // Move cursor to end
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const text = textarea ? textarea.value : '';
            const original = copyBtn.innerHTML;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const tmp = document.createElement('textarea');
                    tmp.value = text;
                    tmp.setAttribute('readonly', '');
                    tmp.style.position = 'absolute';
                    tmp.style.left = '-9999px';
                    document.body.appendChild(tmp);
                    tmp.select();
                    document.execCommand('copy');
                    document.body.removeChild(tmp);
                }
                copyBtn.disabled = true;
                copyBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i><span>Copied!</span>';
                setTimeout(() => { copyBtn.disabled = false; copyBtn.innerHTML = original; }, 1200);
            } catch (e) {
                copyBtn.innerHTML = '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i><span>Copy failed</span>';
                setTimeout(() => { copyBtn.innerHTML = original; }, 1400);
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!textarea) return;
            textarea.value = '';
            textarea.focus();
        });
    }

    if (addVerificationBtn) {
        addVerificationBtn.addEventListener('click', () => {
            appendText("IMPORTANT: Always verify before responding with results, do not make assumptions");
        });
    }

    if (addImplementationBtn) {
        addImplementationBtn.addEventListener('click', () => {
            appendText('IMPORTANT: Avoid over-engineering or unnecessary abstraction');
            appendText('IMPORTANT: Do not add speculative features or future-proofing unless explicitly required');
            appendText('IMPORTANT: Write clean, high-quality code');
        });
    }

    if (addCleanCodeBtn) {
        addCleanCodeBtn.addEventListener('click', () => {
            appendText('IMPORTANT: Solutions must be straightforward and easy to understand');
            appendText('IMPORTANT: Focus only on immediate requirements and deliverables');
        });
    }

    if (addCustom1Btn && customInput1) {
        addCustom1Btn.addEventListener('click', () => {
            const val = (customInput1.value || '').trim();
            if (val) appendText(val);
        });
    }

    if (addCustom2Btn && customInput2) {
        addCustom2Btn.addEventListener('click', () => {
            const val = (customInput2.value || '').trim();
            if (val) appendText(val);
        });
    }
}

if (typeof window !== 'undefined') {
    window.Prompt = {
        initializePrompt
    };
}

