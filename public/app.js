/**
 * CampusFix AI — Frontend Application Logic
 * Includes Interactive Category Tiles, Web Audio Canvas FFT Analyzer, Server-Mediated Outage Stream, and TF-IDF Text Similarity Matching.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration failed: ', err);
      });
    });
  }

  // Interactive Category Tile Grid Selection
  const categoryGrid = document.getElementById('categoryGrid');
  const categoryInput = document.getElementById('category');

  categoryGrid.addEventListener('click', (e) => {
    const tile = e.target.closest('.category-tile');
    if (!tile) return;

    document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));
    tile.classList.add('selected');
    categoryInput.value = tile.getAttribute('data-value');
  });

  // Server-Mediated Outage Stream Connection (SSE)
  const meshTicker = document.getElementById('meshTicker');
  const meshStatusBadge = document.getElementById('meshStatusBadge');
  const meshCount = document.getElementById('meshCount');
  let clientCount = 1;

  function initMeshStream() {
    try {
      const eventSource = new EventSource('/api/outages/stream');
      eventSource.onopen = () => {
        meshStatusBadge.innerHTML = '<span class="pulse-dot"></span> Server Connected';
        meshStatusBadge.style.background = 'var(--success-bg)';
        meshStatusBadge.style.color = 'var(--success-color)';
      };
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'OUTAGE_ALERT') {
            addMeshAlertTicker(data);
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        meshStatusBadge.textContent = 'Server Reconnecting...';
        meshStatusBadge.style.background = 'var(--warning-bg)';
        meshStatusBadge.style.color = 'var(--warning-color)';
      };
    } catch (e) {
      console.warn('SSE not supported');
    }
  }

  function addMeshAlertTicker(alert) {
    const placeholder = meshTicker.querySelector('.mesh-placeholder');
    if (placeholder) placeholder.remove();

    clientCount++;
    meshCount.textContent = `${clientCount} Active Clients`;

    const item = document.createElement('div');
    item.className = 'mesh-alert-item';
    item.innerHTML = `<span><strong>[${alert.category.toUpperCase()}]</strong> ${alert.description}</span> <span style="font-size:0.75rem; color:#64748b;">${new Date(alert.timestamp).toLocaleTimeString()}</span>`;
    meshTicker.prepend(item);

    while (meshTicker.children.length > 5) {
      meshTicker.lastChild.remove();
    }
  }

  initMeshStream();

  // Acoustic Audio Spectrogram Analyzer (Web Audio API + Canvas)
  const recordAudioBtn = document.getElementById('recordAudioBtn');
  const audioStatus = document.getElementById('audioStatus');
  const freqVisualizerContainer = document.getElementById('freqVisualizerContainer');
  const dominantFreqEl = document.getElementById('dominantFreq');
  const freqDiagnosis = document.getElementById('freqDiagnosis');
  const descriptionInput = document.getElementById('description');
  const audioCanvas = document.getElementById('audioCanvas');
  const canvasCtx = audioCanvas.getContext('2d');

  recordAudioBtn.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Audio recording not supported on this device.');
      return;
    }

    try {
      audioStatus.textContent = 'Listening to equipment frequency (3s)...';
      recordAudioBtn.disabled = true;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 512;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      freqVisualizerContainer.hidden = false;

      let peakFrequency = 0;
      let maxMagnitude = 0;
      const startTime = Date.now();

      function drawCanvas() {
        analyser.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = '#020617';
        canvasCtx.fillRect(0, 0, audioCanvas.width, audioCanvas.height);

        const barWidth = (audioCanvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * audioCanvas.height;
          canvasCtx.fillStyle = `rgb(${dataArray[i] + 50}, 130, 246)`;
          canvasCtx.fillRect(x, audioCanvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;

          if (dataArray[i] > maxMagnitude) {
            maxMagnitude = dataArray[i];
            peakFrequency = Math.round(i * (audioCtx.sampleRate / 2) / bufferLength);
          }
        }

        if (Date.now() - startTime < 3000) {
          requestAnimationFrame(drawCanvas);
        } else {
          clearInterval(analysisInterval);
          stream.getTracks().forEach(track => track.stop());
          audioCtx.close();
          recordAudioBtn.disabled = false;
          audioStatus.textContent = 'Acoustic fingerprint recorded successfully!';

          dominantFreqEl.textContent = `${peakFrequency} Hz`;

          let acousticNote = 'Normal operating acoustic pattern.';
          if (peakFrequency > 45 && peakFrequency < 75) {
            acousticNote = 'Electrical Hum Frequency (50Hz/60Hz). Possible transformer or core vibration.';
          } else if (peakFrequency >= 200 && peakFrequency <= 700) {
            acousticNote = 'Mid-Range Frequency Peak. Possible mechanical vibration or fluid movement.';
          } else if (peakFrequency > 1000) {
            acousticNote = 'High-Frequency Peak. Possible air or fluid flow whistle.';
          }

          freqDiagnosis.textContent = acousticNote;
          descriptionInput.value += ` [Acoustic Signature: ${peakFrequency}Hz - ${acousticNote}]`;
          window._lastAcousticSignature = {
            peakFrequencyHz: peakFrequency,
            acousticClassification: acousticNote,
            measurementAvailable: peakFrequency > 0
          };
        }
      }

      const analysisInterval = setInterval(() => {}, 100);
      drawCanvas();
    } catch (err) {
      audioStatus.textContent = 'Microphone access denied or unavailable.';
      recordAudioBtn.disabled = false;
    }
  });

  const form = document.getElementById('diagnoseForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const errorContainer = document.getElementById('errorContainer');
  const errorMessage = document.getElementById('errorMessage');
  const resultsSection = document.getElementById('resultsSection');
  
  const urgencyBadge = document.getElementById('urgencyBadge');
  const causesList = document.getElementById('causesList');
  const checksList = document.getElementById('checksList');
  const memoryBlock = document.getElementById('memoryBlock');
  const memoryList = document.getElementById('memoryList');
  const contactText = document.getElementById('contactText');
  const resultSafetyText = document.getElementById('resultSafetyText');
  const reportTextarea = document.getElementById('reportTextarea');
  const copyBtn = document.getElementById('copyBtn');
  const broadcastBtn = document.getElementById('broadcastBtn');
  const copyFeedback = document.getElementById('copyFeedback');
  const broadcastFeedback = document.getElementById('broadcastFeedback');
  const modelMetaText = document.getElementById('modelMetaText');

  function showError(msg) {
    errorMessage.textContent = msg;
    errorContainer.hidden = false;
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    errorContainer.hidden = true;
    errorMessage.textContent = '';
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnSpinner.hidden = !loading;
    submitBtn.querySelector('.btn-text').textContent = loading ? 'Analyzing Problem & Similarity Match...' : 'Run Diagnosis & Similarity Match';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    resultsSection.hidden = true;

    const category = categoryInput.value;
    const description = descriptionInput.value;
    const symptoms = document.getElementById('symptoms').value;
    const startDate = document.getElementById('startDate').value;

    if (!category || !description.trim()) {
      showError('Please select an equipment category tile and provide a problem description.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          description,
          symptoms,
          startDate,
          acoustic: window._lastAcousticSignature || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server responded with an error.');
      }

      renderResults(data, { category, description, symptoms, startDate });
    } catch (err) {
      showError(err.message || 'Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  let lastDiagnosisData = null;

  function renderResults(data, inputMeta) {
    lastDiagnosisData = { data, inputMeta };

    urgencyBadge.textContent = data.urgency;
    urgencyBadge.className = `urgency-badge urgency-${data.urgency}`;

    causesList.innerHTML = '';
    (data.possibleCauses || []).forEach(cause => {
      const li = document.createElement('li');
      li.textContent = cause;
      causesList.appendChild(li);
    });

    checksList.innerHTML = '';
    (data.preliminaryChecks || []).forEach(check => {
      const li = document.createElement('li');
      li.textContent = check;
      checksList.appendChild(li);
    });

    if (data.historicalPrecedents && data.historicalPrecedents.length > 0) {
      memoryList.innerHTML = '';
      data.historicalPrecedents.forEach(p => {
        const div = document.createElement('div');
        div.className = 'memory-item';
        div.innerHTML = `🔹 <strong>[${p.id}]</strong> Text Similarity Match: <strong>${Math.round(p.similarityScore * 100)}%</strong> — <em>${p.resolution}</em>`;
        memoryList.appendChild(div);
      });
      memoryBlock.hidden = false;
    } else {
      memoryBlock.hidden = true;
    }

    contactText.textContent = data.contactTechnician;
    resultSafetyText.textContent = data.safetyNotice;

    if (data.modelInfo) {
      modelMetaText.textContent = `${data.modelInfo.provider} (${data.modelInfo.model}) — Mode: ${data.modelInfo.mode}`;
    }

    const reportContent = [
      `=== CAMPUSFIX AI MAINTENANCE REPORT ===`,
      `Timestamp: ${new Date(data.timestamp).toLocaleString()}`,
      `Category: ${inputMeta.category.toUpperCase()}`,
      `Urgency Level: ${data.urgency.toUpperCase()}`,
      ``,
      `[PROBLEM DESCRIPTION]`,
      inputMeta.description,
      inputMeta.symptoms ? `Observed Symptoms: ${inputMeta.symptoms}` : '',
      inputMeta.startDate ? `Started: ${inputMeta.startDate}` : '',
      ``,
      `[POSSIBLE CAUSES]`,
      ...(data.possibleCauses || []).map(c => `- ${c}`),
      ``,
      `[RECOMMENDED PRELIMINARY CHECKS]`,
      ...(data.preliminaryChecks || []).map(c => `- ${c}`),
      ``,
      data.historicalPrecedents && data.historicalPrecedents.length > 0
        ? `[ILLUSTRATIVE TEXT-SIMILARITY PRECEDENTS]\n` + data.historicalPrecedents.map(p => `- [${p.id}] (${Math.round(p.similarityScore*100)}% illustrative text match, category: ${p.category}): ${p.resolution}\n  Note: Text similarity is illustrative vector comparison, not proof of a fault or equipment identity.`).join('\n')
        : `[ILLUSTRATIVE TEXT-SIMILARITY PRECEDENTS]\n- No direct category-compatible illustrative precedents found with sufficient similarity. Similarity matches from other equipment types are omitted to prevent misdiagnosis.`,
      ``,
      `[TECHNICIAN ADVICE]`,
      data.contactTechnician,
      ``,
      `[SAFETY NOTICE]`,
      data.safetyNotice,
      `=====================================`,
      `Generated by CampusFix AI (OPEN//BUILD 2026)`
    ].filter(Boolean).join('\n');

    reportTextarea.value = reportContent;
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(reportTextarea.value);
      copyFeedback.hidden = false;
      setTimeout(() => { copyFeedback.hidden = true; }, 3000);
    } catch (err) {
      reportTextarea.select();
      document.execCommand('copy');
      copyFeedback.hidden = false;
      setTimeout(() => { copyFeedback.hidden = true; }, 3000);
    }
  });

  broadcastBtn.addEventListener('click', async () => {
    if (!lastDiagnosisData) return;
    try {
      await fetch('/api/outages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: lastDiagnosisData.inputMeta.category,
          description: lastDiagnosisData.inputMeta.description,
          urgency: lastDiagnosisData.data.urgency
        })
      });
      broadcastFeedback.hidden = false;
      setTimeout(() => { broadcastFeedback.hidden = true; }, 3000);
    } catch (err) {
      alert('Failed to broadcast notice.');
    }
  });
});
