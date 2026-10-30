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
    const locText = alert.location ? `📍 ${alert.location}` : '';
    const statusVal = alert.status || 'Active / Unfixed';
    const isResolved = statusVal === 'Resolved / Fixed';
    const statusBadgeText = isResolved ? '🟢 Resolved (Fixed)' : '🔴 Active Outage (Unfixed)';
    const statusBg = isResolved ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const statusColor = isResolved ? '#4ade80' : '#f87171';
    const statusBadge = `<span style="font-size: 0.75rem; background: ${statusBg}; color: ${statusColor}; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 500;">${statusBadgeText}</span>`;

    item.innerHTML = `<div><strong>[${alert.category.toUpperCase()}]</strong> ${alert.description} <div style="font-size: 0.75rem; color: #38bdf8; margin-top: 2px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">${locText ? `<span>${locText}</span>` : ''} ${statusBadge}</div></div> <span style="font-size:0.75rem; color:#94a3b8; white-space:nowrap; margin-left: 8px;">${new Date(alert.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}</span>`;
    meshTicker.prepend(item);

    while (meshTicker.children.length > 5) {
      meshTicker.lastChild.remove();
    }
  }

  initMeshStream();

  // OPEN//BUILD 2026 Demo Scenarios toggle hide & show
  const toggleDemoBtn = document.getElementById('toggleDemoBtn');
  const demoContentWrapper = document.getElementById('demoContentWrapper');

  if (toggleDemoBtn && demoContentWrapper) {
    toggleDemoBtn.addEventListener('click', () => {
      const isHidden = demoContentWrapper.hidden;
      demoContentWrapper.hidden = !isHidden;
      toggleDemoBtn.textContent = isHidden ? 'Hide 🔼' : 'Show 🔽';
    });
  }

  // OPEN//BUILD 2026 Demo Scenarios helper
  const demoScene3 = document.getElementById('demoScene3');
  const demoScene4 = document.getElementById('demoScene4');
  const demoScene5 = document.getElementById('demoScene5');
  const symptomsInput = document.getElementById('symptoms');
  const startDateInput = document.getElementById('startDate');

  if (demoScene3) {
    demoScene3.addEventListener('click', () => {
      document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));
      const tile = document.querySelector('.category-tile[data-value="electrical"]');
      if (tile) tile.classList.add('selected');
      categoryInput.value = 'electrical';
      descriptionInput.value = 'An electrical outlet is sparking.';
      if (symptomsInput) symptomsInput.value = 'sparking, crackling sounds';
      if (startDateInput) startDateInput.value = 'Just now';
      if (locationInput) {
        locationInput.value = 'Science Complex, Room 302';
        if (locationInputWrapper) locationInputWrapper.hidden = false;
        if (autoLocationBadge) autoLocationBadge.hidden = true;
      }
      form.requestSubmit();
    });
  }

  if (demoScene4) {
    demoScene4.addEventListener('click', () => {
      document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));
      const tile = document.querySelector('.category-tile[data-value="plumbing"]');
      if (tile) tile.classList.add('selected');
      categoryInput.value = 'plumbing';
      descriptionInput.value = 'Water pipe leaking slowly under cafeteria sink cabinet.';
      if (symptomsInput) symptomsInput.value = 'dripping water, pooling';
      if (startDateInput) startDateInput.value = 'Today at 9 AM';
      if (locationInput) {
        locationInput.value = 'Student Center Cafeteria, Floor 1';
        if (locationInputWrapper) locationInputWrapper.hidden = false;
        if (autoLocationBadge) autoLocationBadge.hidden = true;
      }
      form.requestSubmit();
    });
  }

  if (demoScene5) {
    demoScene5.addEventListener('click', () => {
      document.querySelectorAll('.category-tile').forEach(t => t.classList.remove('selected'));
      const tile = document.querySelector('.category-tile[data-value="cooling"]');
      if (tile) tile.classList.add('selected');
      categoryInput.value = 'cooling';
      descriptionInput.value = 'Air handler unit making high-frequency whistling sound.';
      if (symptomsInput) symptomsInput.value = 'whistling, warm air';
      if (startDateInput) startDateInput.value = 'Yesterday afternoon';
      if (locationInput) {
        locationInput.value = 'Engineering Hall, Lab 402';
        if (locationInputWrapper) locationInputWrapper.hidden = false;
        if (autoLocationBadge) autoLocationBadge.hidden = true;
      }
      window._lastAcousticSignature = {
        peakFrequencyHz: 3094,
        acousticClassification: 'High-Frequency Peak. Possible air or fluid flow whistle.',
        measurementAvailable: true
      };
      form.requestSubmit();
    });
  }

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

  // Geolocation auto-detect on page load (tries auto location first; hides manual input if successful, shows manual input if it fails)
  const locationInput = document.getElementById('locationInput');
  const locationInputWrapper = document.getElementById('locationInputWrapper');
  const autoLocateBtn = document.getElementById('autoLocateBtn');
  const autoLocationBadge = document.getElementById('autoLocationBadge');
  const autoLocationText = document.getElementById('autoLocationText');
  const changeLocationBtn = document.getElementById('changeLocationBtn');

  function attemptAutoLocation(onSuccess, onFailure) {
    if (!navigator.geolocation) {
      if (onFailure) onFailure();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        const detectedLoc = `GPS Pin: (${lat}, ${lon}) - Campus Zone`;
        locationInput.value = detectedLoc;
        autoLocationText.textContent = `📍 Auto-located: ${detectedLoc}`;
        locationInputWrapper.hidden = true;
        autoLocationBadge.hidden = false;
        if (onSuccess) onSuccess(detectedLoc);
      },
      (error) => {
        locationInputWrapper.hidden = false;
        autoLocationBadge.hidden = true;
        if (onFailure) onFailure(error);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  // Attempt auto-location on page load
  attemptAutoLocation(null, () => {
    locationInputWrapper.hidden = false;
    autoLocationBadge.hidden = true;
  });

  if (autoLocateBtn && locationInput && autoLocationBadge && locationInputWrapper) {
    autoLocateBtn.addEventListener('click', () => {
      autoLocateBtn.textContent = 'Locating...';
      attemptAutoLocation(
        () => { autoLocateBtn.textContent = '📍 Auto-Detect GPS'; },
        () => {
          alert('Auto-location failed. Please enter your location manually.');
          autoLocateBtn.textContent = '📍 Auto-Detect GPS';
        }
      );
    });

    if (changeLocationBtn) {
      changeLocationBtn.addEventListener('click', () => {
        locationInputWrapper.hidden = false;
        autoLocationBadge.hidden = true;
        locationInput.value = '';
        locationInput.focus();
      });
    }
  }

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
  const outageStatusSelect = document.getElementById('outageStatusSelect');
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

    const locationStr = locationInput ? locationInput.value.trim() : 'Campus-wide';
    const statusVal = outageStatusSelect ? outageStatusSelect.value : 'Active / Unfixed';

    const reportContent = [
      `=== CAMPUSFIX AI MAINTENANCE REPORT ===`,
      `Timestamp: ${new Date(data.timestamp).toLocaleString()}`,
      `Category: ${inputMeta.category.toUpperCase()}`,
      `Urgency Level: ${data.urgency.toUpperCase()}`,
      `Outage Resolution Status: ${statusVal}`,
      `Location: ${locationStr}`,
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
        ? `[ILLUSTRATIVE TEXT-SIMILARITY PRECEDENTS]\n` + data.historicalPrecedents.map(p => `- [${p.id}] (${Math.round(p.similarityScore*100)}% illustrative text match, category: ${p.category}): ${p.resolution}`).join('\n')
        : `[ILLUSTRATIVE TEXT-SIMILARITY PRECEDENTS]\n- No direct category-compatible illustrative precedents found with sufficient similarity. Similarity matches from other equipment types are omitted for safety and relevance.`,
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
    const locationVal = locationInput ? locationInput.value.trim() : 'Campus-wide';
    const statusVal = outageStatusSelect ? outageStatusSelect.value : 'Active / Unfixed';
    try {
      await fetch('/api/outages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: lastDiagnosisData.inputMeta.category,
          description: lastDiagnosisData.inputMeta.description,
          urgency: lastDiagnosisData.data.urgency,
          location: locationVal,
          status: statusVal
        })
      });
      broadcastFeedback.hidden = false;
      setTimeout(() => { broadcastFeedback.hidden = true; }, 3000);
    } catch (err) {
      alert('Failed to broadcast notice.');
    }
  });
});
