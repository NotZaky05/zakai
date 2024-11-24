    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    'space-grotesk': ['Space Grotesk', 'sans-serif'],
                },
                animation: {
                    'gradient': 'gradient 8s ease infinite',
                },
                keyframes: {
                    gradient: {
                        '0%, 100%': {
                            'background-size': '200% 200%',
                            'background-position': 'left center'
                        },
                        '50%': {
                            'background-size': '200% 200%',
                            'background-position': 'right center'
                        },
                    },
                },
            },
        },
    }

    const GROQ_API_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
    const API_KEY = "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";

    // Cache DOM elements
    const modelSelect = document.getElementById('modelSelect');
    const queryInput = document.getElementById('queryInput');
    const submitButton = document.getElementById('submitQuery');
    const clearButton = document.getElementById('clearButton');
    const responseOutput = document.getElementById('response');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Initialize marked options
    marked.setOptions({
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(code, { language: lang }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        langPrefix: 'hljs language-',
        breaks: true,
        gfm: true
    });

    // Add input animations
    queryInput.addEventListener('focus', () => {
        queryInput.classList.add('transform', 'scale-[1.02]');
    });

    queryInput.addEventListener('blur', () => {
        queryInput.classList.remove('transform', 'scale-[1.02]');
    });

    // Event Listeners
    queryInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleSubmit();
        }
    });

    submitButton.addEventListener('click', handleSubmit);
    
    clearButton.addEventListener('click', () => {
        queryInput.value = '';
        responseOutput.classList.add('hidden');
        responseOutput.innerHTML = '';
    });

    async function handleSubmit() {
        const query = queryInput.value.trim();
        if (!query) {
            showError("Please enter a question.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(GROQ_API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                },
                body: JSON.stringify({
                    model: modelSelect.value,
                    messages: [{ role: "user", content: query }],
                    temperature: 0.7,
                    max_tokens: 4096,
                    top_p: 1,
                    stream: false
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            showResponse(data.choices[0].message.content);
        } catch (error) {
            console.error("Error:", error);
            showError(error.message || "Failed to get response. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function showError(message) {
        responseOutput.classList.remove('hidden');
        responseOutput.innerHTML = `
            <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                <p class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    ${message}
                </p>
            </div>`;
    }

    function showResponse(message) {
        responseOutput.classList.remove('hidden');
        const formattedContent = marked(message);
        responseOutput.innerHTML = `
            <div class="prose prose-invert max-w-none">
                ${formattedContent}
            </div>`;
        hljs.highlightAll();

        // Smooth scroll to response
        responseOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        buttonText.classList.toggle('hidden', isLoading);
        loadingSpinner.classList.toggle('hidden', !isLoading);
        if (isLoading) {
            loadingSpinner.classList.add('flex');
        } else {
            loadingSpinner.classList.remove('flex');
        }
        queryInput.disabled = isLoading;
        modelSelect.disabled = isLoading;
    }