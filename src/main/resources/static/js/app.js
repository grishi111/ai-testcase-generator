const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const userStoryEl = document.getElementById('userStory');
const apiSpecEl = document.getElementById('apiSpec');
const jiraUrlEl = document.getElementById('jiraUrl');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const exportStatusEl = document.getElementById('exportStatus');

const summaryJiraEl = document.getElementById('summaryJira');
const summaryStoryLenEl = document.getElementById('summaryStoryLen');
const summaryApiLenEl = document.getElementById('summaryApiLen');
const summaryNotesEl = document.getElementById('summaryNotes');

let lastMarkdown = ''; // holds the latest cleaned markdown table for export

function setMainStatus(message, type) {
    statusEl.textContent = message || '';
    statusEl.className = 'main-status' + (type ? ' ' + type : '');
}

function setExportStatus(message, type) {
    exportStatusEl.textContent = message || '';
    exportStatusEl.className = 'export-status' + (type ? ' ' + type : '');
}

function updateSummary() {
    const jira = jiraUrlEl.value.trim();
    const story = userStoryEl.value.trim();
    const api = apiSpecEl.value.trim();

    summaryJiraEl.textContent = jira || 'Not provided';
    summaryStoryLenEl.textContent = story.length + ' characters';
    summaryApiLenEl.textContent = api.length + ' characters';

    if (!story && !api) {
        summaryNotesEl.textContent = 'No user story or API spec yet. Provide at least one before generating.';
    } else if (story && !api) {
        summaryNotesEl.textContent = 'Only user story is provided. API-related test cases will rely on story context.';
    } else if (!story && api) {
        summaryNotesEl.textContent = 'Only API specification is provided. Functional scenarios will be inferred from endpoints.';
    } else {
        summaryNotesEl.textContent = 'User story and API specification are both provided for richer, more accurate test cases.';
    }
}

[userStoryEl, apiSpecEl, jiraUrlEl].forEach(el => {
    el.addEventListener('input', updateSummary);
});

function cleanMarkdownTable(md, expectedCols) {
    const lines = md.split(/\r?\n/);
    const cleaned = [];
    let inTable = false;

    for (let line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('|') && trimmed.includes('---')) {
            inTable = true;
            cleaned.push(line);
            continue;
        }

        if (inTable && trimmed.startsWith('|') && !trimmed.includes('---')) {
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            const nonEmpty = cells.some(c => c.length > 0);
            const hasId = cells[0] && cells[0].length > 0;

            if (!nonEmpty || !hasId || cells.length < expectedCols) {
                continue;
            }
            cleaned.push(line);
            continue;
        }

        cleaned.push(line);
    }

    return cleaned.join('\n');
}

function markdownTableToArray(md) {
    const lines = md.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    if (lines.length < 3) return [];

    const header = lines[0]
        .split('|')
        .slice(1, -1)
        .map(h => h.trim());

    const rows = [];
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith('|') || line.includes('---')) continue;

        const cells = line
            .split('|')
            .slice(1, -1)
            .map(c => c.trim());

        if (cells.length === header.length) {
            const row = {};
            header.forEach((key, idx) => {
                row[key] = cells[idx];
            });
            rows.push(row);
        }
    }

    return rows;
}

function exportToExcel() {
    if (!lastMarkdown || lastMarkdown.includes('Waiting for input')) {
        setExportStatus('No test cases to export. Generate test cases first.', 'error');
        return;
    }

    const data = markdownTableToArray(lastMarkdown);
    if (!data || data.length === 0) {
        setExportStatus('Could not parse test cases for export.', 'error');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Cases');

    const colWidths = [];
    const headers = Object.keys(data[0]);
    headers.forEach(header => {
        let maxLen = header.length;
        data.forEach(row => {
            const cellLen = (row[header] || '').toString().length;
            maxLen = Math.max(maxLen, cellLen);
        });
        colWidths.push({ wch: Math.min(maxLen + 2, 50) });
    });
    ws['!cols'] = colWidths;

    const filename = `test-cases-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    setExportStatus(`Exported ${data.length} test cases to ${filename}`, 'success');
}

clearBtn.addEventListener('click', () => {
    userStoryEl.value = '';
    apiSpecEl.value = '';
    jiraUrlEl.value = '';
    outputEl.innerHTML = 'Cleared. Paste a user story and optionally API specs, then click "Generate test cases".';
    exportBtn.style.display = 'none';
    lastMarkdown = '';
    setMainStatus('', '');
    setExportStatus('', '');
    updateSummary();
});

exportBtn.addEventListener('click', exportToExcel);

generateBtn.addEventListener('click', async () => {
    const userStoryText = userStoryEl.value.trim();
    const apiSpecText = apiSpecEl.value.trim();
    const jiraUrl = jiraUrlEl.value.trim();

    updateSummary();
    setExportStatus('', '');

    if (!userStoryText && !apiSpecText) {
        setMainStatus('Please provide at least a user story or API specification.', 'error');
        return;
    }

    const payload = {
        userStoryText: userStoryText || (`Fetch from Jira: ${jiraUrl || 'N/A'}`),
        apiSpecText: apiSpecText
    };

    setMainStatus('Generating test cases with AI…', '');
    outputEl.innerHTML = '';
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating…';
    exportBtn.style.display = 'none';
    lastMarkdown = '';

    try {
        const response = await fetch('/ai-tests/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            setMainStatus(`Error ${response.status}: ${response.statusText}`, 'error');
            outputEl.textContent = text || 'Request failed.';
            return;
        }

        const data = await response.json();
        const raw = data.generatedTestCases || JSON.stringify(data, null, 2);
        const cleanedMarkdown = cleanMarkdownTable(raw, 8);

        lastMarkdown = cleanedMarkdown;

        const html = marked.parse(cleanedMarkdown);
        outputEl.innerHTML = html;
        setMainStatus('Test cases generated successfully.', 'success');
        exportBtn.style.display = 'inline-flex';
    } catch (err) {
        console.error(err);
        setMainStatus('Network or server error. Check console and backend logs.', 'error');
        outputEl.textContent = String(err);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate test cases';
    }
});

// Initialize summary on load
updateSummary();