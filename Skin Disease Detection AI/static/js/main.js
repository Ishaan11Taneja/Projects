document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const preview = document.getElementById('preview');
    const loading = document.getElementById('loading');
    const imagePreview = document.getElementById('imagePreview');
    const condition = document.getElementById('condition');
    const confidence = document.getElementById('confidence');
    const precautions = document.getElementById('precautions');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    function preventDefaults (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Display image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
        }
        reader.readAsDataURL(file);

        // Show loading state
        loading.classList.remove('d-none');
        preview.classList.add('d-none');

        // Upload and analyze image
        uploadImage(file);
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                alert(result.error);
                loading.classList.add('d-none');
                return;
            }

            // Update results
            condition.textContent = result.condition;
            confidence.textContent = result.confidence;
            
            // Clear and update precautions
            precautions.innerHTML = '';
            result.precautions.forEach(precaution => {
                const li = document.createElement('li');
                li.textContent = precaution;
                precautions.appendChild(li);
            });

            // Show results
            loading.classList.add('d-none');
            preview.classList.remove('d-none');

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while processing the image');
            loading.classList.add('d-none');
        }
    }
}); 