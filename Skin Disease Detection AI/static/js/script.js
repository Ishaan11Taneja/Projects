// script.js
class ImageAnalyzer {
    constructor() {
        this.uploadArea = document.querySelector('.upload-area');
        this.fileInput = document.getElementById('fileInput');
        this.preview = document.getElementById('preview');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.analysisSection = document.getElementById('analysisSection');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toast = document.getElementById('toast');
        this.probabilityChart = null;
        
        this.setupEventListeners();
        this.setupTabs();
    }

    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const previewImage = document.getElementById('previewImage');
        const imagePreview = document.querySelector('.image-preview');
        const removeImage = document.getElementById('removeImage');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const chooseBtn = document.getElementById('chooseBtn');

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // Handle drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFile(file);
            }
        });

        // Handle remove image
        removeImage.addEventListener('click', () => {
            fileInput.value = '';
            previewImage.src = '';
            imagePreview.classList.add('d-none');
            chooseBtn.classList.remove('d-none');
            analyzeBtn.classList.add('d-none');
            analyzeBtn.disabled = true;
        });

        // Handle analyze button
        analyzeBtn.addEventListener('click', () => {
            this.analyzeImage(fileInput.files[0]);
        });

        // Report actions
        document.getElementById('downloadPdf').addEventListener('click', () => this.downloadReport());
        document.getElementById('shareReport').addEventListener('click', () => this.shareReport());
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.analysis-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showToast('Please upload an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImage = document.getElementById('previewImage');
            const imagePreview = document.querySelector('.image-preview');
            const chooseBtn = document.getElementById('chooseBtn');
            const analyzeBtn = document.getElementById('analyzeBtn');
            
            previewImage.src = e.target.result;
            imagePreview.classList.remove('d-none');
            chooseBtn.classList.add('d-none');
            analyzeBtn.classList.remove('d-none');
            analyzeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.style.backgroundColor = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
        this.toast.style.color = 'white';
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    async analyzeImage(file) {
        if (!file) return;

        try {
            this.showToast('Analyzing image...', 'info');
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            this.updateReport(data);
            this.showToast('Analysis complete!', 'success');
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error analyzing image. Please try again.', 'error');
        }
    }

    updateReport(data) {
        this.lastAnalysis = data;
        this.analysisSection.style.display = 'block';
        
        // Update confidence value
        document.getElementById('confidenceValue').textContent = 
            `${(data.confidence * 100).toFixed(1)}%`;
        
        // Update severity level
        const severity = this.calculateSeverity(data.confidence);
        document.getElementById('severityValue').textContent = severity;
        
        // Update recommendation
        document.getElementById('recommendationValue').textContent = 
            this.getRecommendation(severity);

        // Update diagnosis summary
        document.getElementById('diagnosisSummary').textContent = 
            `Based on our advanced AI analysis, the image shows characteristics of ${data.prediction} with a confidence level of ${(data.confidence * 100).toFixed(1)}%. This assessment is based on comprehensive pattern recognition and medical knowledge integration.`;

        // Update key findings
        document.getElementById('keyFindings').innerHTML = `
            <li><i class="fas fa-check-circle"></i>Primary condition: ${data.prediction}</li>
            <li><i class="fas fa-chart-line"></i>Confidence level: ${(data.confidence * 100).toFixed(1)}%</li>
            <li><i class="fas fa-exclamation-triangle"></i>Severity: ${severity}</li>
            <li><i class="fas fa-clock"></i>Analysis timestamp: ${new Date().toLocaleString()}</li>
        `;

        // Update treatment recommendations
        document.getElementById('treatmentRecommendations').innerHTML = `
            <li><i class="fas fa-ambulance"></i>${this.getRecommendation(severity)}</li>
            <li><i class="fas fa-shield-alt"></i>Follow specific precautions for ${data.prediction}</li>
            <li><i class="fas fa-eye"></i>Monitor for any changes in condition</li>
            <li><i class="fas fa-notes-medical"></i>Keep a record of symptoms and progression</li>
        `;

        // Update follow-up schedule
        document.getElementById('followUpSchedule').textContent = 
            `Based on the severity level (${severity}), we recommend a follow-up consultation within ${this.getFollowUpTime(severity)}. Regular monitoring is essential for proper treatment and recovery.`;

        // Update confidence meter
        const confidenceFill = document.querySelector('.confidence-fill');
        confidenceFill.style.width = `${(data.confidence * 100)}%`;
    }

    calculateSeverity(confidence) {
        if (confidence > 0.8) return 'High';
        if (confidence > 0.5) return 'Medium';
        return 'Low';
    }

    getRecommendation(severity) {
        switch(severity) {
            case 'High':
                return 'Immediate medical consultation recommended';
            case 'Medium':
                return 'Schedule a medical consultation';
            default:
                return 'Monitor and consult if symptoms persist';
        }
    }

    getFollowUpTime(severity) {
        switch(severity) {
            case 'High':
                return '24-48 hours';
            case 'Medium':
                return '1 week';
            default:
                return '2 weeks';
        }
    }

    downloadReport() {
        if (!this.lastAnalysis) {
            this.showToast('No analysis data available to download', 'error');
            return;
        }

        const { prediction, confidence } = this.lastAnalysis;
        const severity = confidence > 0.8 ? 'High' : confidence > 0.5 ? 'Medium' : 'Low';
        const recommendation = confidence > 0.8 ? 'Immediate medical consultation recommended' : 
                             confidence > 0.5 ? 'Schedule a medical consultation' : 
                             'Monitor and consult if symptoms persist';
        const followUpTime = confidence > 0.8 ? 'Within 24-48 hours' : 
                            confidence > 0.5 ? 'Within 1 week' : 
                            'Within 2 weeks';

        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Add header with logo and title
        doc.setFillColor(0, 123, 255);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('SkinCare AI', 20, 20);
        
        // Add timestamp
        doc.setTextColor(255, 255, 255, 0.8);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 25);

        // Add separator line
        doc.setDrawColor(0, 123, 255);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Add patient information section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text('Patient Information', 20, 45);
        doc.setFontSize(10);
        doc.text('Name: _______________________', 20, 52);
        doc.text('Date of Birth: _______________________', 20, 58);
        doc.text('Contact: _______________________', 20, 64);

        // Add diagnosis summary
        doc.setFontSize(16);
        doc.text('Diagnosis Summary', 20, 80);
        doc.setFontSize(10);
        doc.setTextColor(0, 123, 255);
        doc.setFont(undefined, 'bold');
        doc.text(`Detected Condition: ${prediction}`, 20, 87);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`Confidence Level: ${(confidence * 100).toFixed(1)}%`, 20, 93);
        doc.text(`Severity Level: ${severity}`, 20, 99);

        // Add key findings
        doc.setFontSize(16);
        doc.text('Key Findings', 20, 115);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const findings = [
            `AI Analysis Confidence: ${(confidence * 100).toFixed(1)}%`,
            `Severity Assessment: ${severity}`,
            `Condition Type: ${prediction}`,
            'Note: This is an AI-assisted analysis and should be verified by a medical professional'
        ];
        findings.forEach((finding, index) => {
            doc.text(`• ${finding}`, 20, 122 + (index * 6));
        });

        // Add treatment recommendations
        doc.setFontSize(16);
        doc.text('Treatment Recommendations', 20, 150);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const recommendations = [
            recommendation,
            'Keep the affected area clean and dry',
            'Avoid scratching or irritating the skin',
            'Monitor for any changes in symptoms',
            'Follow up with healthcare provider as recommended'
        ];
        recommendations.forEach((rec, index) => {
            doc.text(`• ${rec}`, 20, 157 + (index * 6));
        });

        // Add follow-up schedule
        doc.setFontSize(16);
        doc.text('Follow-up Schedule', 20, 195);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Recommended Follow-up: ${followUpTime}`, 20, 202);
        doc.text('Schedule: _______________________', 20, 208);

        // Add footer
        doc.setFillColor(0, 123, 255);
        doc.rect(0, 277, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('This report is generated by SkinCare AI and should be reviewed by a medical professional.', 20, 285);
        doc.text('For emergency situations, please seek immediate medical attention.', 20, 290);

        // Add page numbers
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' });
        }

        // Save the PDF
        doc.save('skin_analysis_report.pdf');
        this.showToast('Report downloaded successfully', 'success');
    }

    shareReport() {
        // Implement sharing functionality with modern Web Share API
        if (navigator.share) {
            navigator.share({
                title: 'Skin Disease Detection Report',
                text: 'Check out my skin disease detection report',
                url: window.location.href
            })
            .then(() => this.showToast('Report shared successfully', 'success'))
            .catch((error) => {
                console.error('Error sharing:', error);
                this.showToast('Failed to share report', 'error');
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = window.location.href;
            navigator.clipboard.writeText(shareUrl)
                .then(() => this.showToast('Report link copied to clipboard', 'success'))
                .catch(() => this.showToast('Failed to copy link', 'error'));
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ImageAnalyzer();
}); 