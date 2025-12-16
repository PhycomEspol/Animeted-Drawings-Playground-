const form = document.getElementById('renderForm');
const fileInput = document.getElementById('imageInput');
const fileNameDisplay = document.getElementById('fileName');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');
const resultArea = document.getElementById('resultArea');
const outputImage = document.getElementById('outputImage');
const downloadLink = document.getElementById('downloadLink');
const renderBtn = document.getElementById('renderBtn');

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = e.target.files[0].name;
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // UI Update
    renderBtn.disabled = true;
    renderBtn.textContent = 'Processing...';
    statusDiv.classList.remove('hidden');
    resultArea.classList.add('hidden');
    statusText.textContent = 'Uploading and rendering... (This may take 1-2 minutes)';

    try {
        const response = await fetch('/api/render', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Render failed');
        }

        const data = await response.json();
        
        outputImage.src = data.outputUrl;
        downloadLink.href = data.outputUrl;
        resultArea.classList.remove('hidden');
        statusDiv.classList.add('hidden');

    } catch (err) {
        statusText.textContent = `Error: ${err.message}`;
        console.error(err);
    } finally {
        renderBtn.disabled = false;
        renderBtn.textContent = 'Animate!';
    }
});
