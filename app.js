/* ==========================================================================
   CyberShield AI - Password Strength Checker & Generator Logic
   ========================================================================== */

// --- Dictionaries & Pattern Definitions ---
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', '12345678', '12345', 'qwerty', 'password1',
  '111111', '1234567', 'dragon', 'welcome', 'admin', 'football', 'monkey',
  'shadow', 'master', 'sunshine', 'princess', 'letmein', 'trustno1', 'iloveyou',
  'solo', 'starwars', 'superman', 'baseball', 'harley', 'batman', 'chelsia'
];

const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
  '123456', '234567', '345678', '456789', '567890', '987654', '876543'
];

const MEMORABLE_WORDS = [
  'Atlas', 'Breeze', 'Cipher', 'Drift', 'Echo', 'Falcon', 'Gazer', 'Helix',
  'Iris', 'Jungle', 'Krypton', 'Lunar', 'Matrix', 'Nebula', 'Orbit', 'Pulse',
  'Quantum', 'Raptor', 'Shadow', 'Titan', 'Vortex', 'Velvet', 'Wild', 'Zenith'
];

const SYMBOLS_POOL = '@$%!^&*#-_+=~`<>?/{}\\|:;';

// --- State Variables ---
let currentTab = 'checker';

// --- Python API Backend Integration ---
async function callPythonAPI(endpoint, payload) {
  try {
    const apiBase = window.location.port === '5000' ? '' : 'http://localhost:5000';
    const response = await fetch(`${apiBase}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    // API not reachable, fallback to client-side
  }
  return null;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('passwordInput');
  
  // Real-time evaluation listener
  passwordInput.addEventListener('input', (e) => {
    evaluatePassword(e.target.value);
  });

  // Initial trigger
  evaluatePassword('');
  generatePassword();
});

// --- Tab Navigation ---
function switchTab(tabName) {
  currentTab = tabName;
  const checkerSection = document.getElementById('checkerSection');
  const generatorSection = document.getElementById('generatorSection');
  const tabCheckerBtn = document.getElementById('tabCheckerBtn');
  const tabGeneratorBtn = document.getElementById('tabGeneratorBtn');

  if (tabName === 'checker') {
    checkerSection.classList.add('active');
    generatorSection.classList.remove('active');
    tabCheckerBtn.classList.add('active');
    tabGeneratorBtn.classList.remove('active');
  } else {
    checkerSection.classList.remove('active');
    generatorSection.classList.add('active');
    tabCheckerBtn.classList.remove('active');
    tabGeneratorBtn.classList.add('active');
  }
}

// ==========================================================================
// PART 1: PASSWORD STRENGTH CHECKER & AI ENGINE
// ==========================================================================

function evaluatePassword(pwd) {
  const reqLength = pwd.length >= 8;
  const reqUpper = /[A-Z]/.test(pwd);
  const reqLower = /[a-z]/.test(pwd);
  const reqNumber = /[0-9]/.test(pwd);
  const reqSymbol = /[@$%!^&*#\-_+=~`<>?/{}\[\]\\|:;,"']/.test(pwd);

  // Update rule checklist UI
  updateRequirementUI('reqLength', reqLength);
  updateRequirementUI('reqUpper', reqUpper);
  updateRequirementUI('reqLower', reqLower);
  updateRequirementUI('reqNumber', reqNumber);
  updateRequirementUI('reqSymbol', reqSymbol);

  // Calculate Charset & Entropy
  let charsetSize = 0;
  if (reqLower) charsetSize += 26;
  if (reqUpper) charsetSize += 26;
  if (reqNumber) charsetSize += 10;
  if (reqSymbol) charsetSize += 32;

  const length = pwd.length;
  let entropy = 0;
  if (length > 0 && charsetSize > 0) {
    entropy = Math.round(length * Math.log2(charsetSize));
  }

  // Detect Patterns & Deduct Penalty
  const patternAnalysis = detectPatterns(pwd);
  let adjustedEntropy = Math.max(0, entropy - patternAnalysis.penalty);

  // Calculate Score (0 - 100)
  let score = 0;
  if (length > 0) {
    // Base score from rules passed (max 40 pts)
    const passedRulesCount = [reqLength, reqUpper, reqLower, reqNumber, reqSymbol].filter(Boolean).length;
    score += (passedRulesCount / 5) * 40;

    // Entropy contribution (max 60 pts based on 80 bits target)
    const entropyScore = Math.min(60, (adjustedEntropy / 80) * 60);
    score += entropyScore;

    // Penalty applied
    score = Math.max(5, Math.min(100, Math.round(score - patternAnalysis.penalty / 2)));
  }

  // Update Tech Stats
  document.getElementById('statEntropy').innerText = `${adjustedEntropy} bits`;
  document.getElementById('statLength').innerText = `${length} chars`;
  document.getElementById('statCharset').innerText = `${charsetSize}`;
  document.getElementById('scoreBadge').innerText = `${score} / 100 PTS`;

  // Determine Category Status
  let statusText = 'Enter a Password';
  let statusClass = 'status-empty';
  let fillClass = '';
  let fillWidth = `${score}%`;

  if (length > 0) {
    if (score < 25) {
      statusText = 'Very Weak ⚠️';
      statusClass = 'status-very-weak';
      fillClass = 'fill-very-weak';
    } else if (score < 50) {
      statusText = 'Weak ⚡';
      statusClass = 'status-weak';
      fillClass = 'fill-weak';
    } else if (score < 75) {
      statusText = 'Fair / Moderate 🛡️';
      statusClass = 'status-fair';
      fillClass = 'fill-fair';
    } else if (score < 90) {
      statusText = 'Strong 💪';
      statusClass = 'status-strong';
      fillClass = 'fill-strong';
    } else {
      statusText = 'Ultra-Secure 🚀';
      statusClass = 'status-ultra';
      fillClass = 'fill-ultra';
    }
  } else {
    fillWidth = '0%';
  }

  // Update Meter UI
  const label = document.getElementById('strengthLabel');
  const fill = document.getElementById('meterBarFill');

  label.innerText = statusText;
  label.className = `strength-status ${statusClass}`;
  fill.style.width = fillWidth;
  fill.className = `meter-bar-fill ${fillClass}`;

  // Time to Crack Calculation
  const crackTime = calculateTimeToCrack(charsetSize, length, patternAnalysis.penalty);
  document.getElementById('timeToCrackDisplay').innerText = length > 0 ? crackTime : '---';

  // Render AI Insights
  renderAIInsights(pwd, patternAnalysis, reqLength, reqUpper, reqLower, reqNumber, reqSymbol);
}

function updateRequirementUI(elementId, isPassed) {
  const el = document.getElementById(elementId);
  const icon = el.querySelector('.req-icon');

  if (isPassed) {
    el.classList.add('passed');
    el.classList.remove('failed');
    icon.className = 'fa-solid fa-circle-check req-icon';
  } else {
    el.classList.remove('passed');
    el.classList.add('failed');
    icon.className = 'fa-solid fa-circle-xmark req-icon';
  }
}

// --- Time to Crack Engine ---
function calculateTimeToCrack(charsetSize, length, penaltyBits = 0) {
  if (length === 0 || charsetSize === 0) return '---';

  // Total possible combinations = charsetSize ^ length
  // Effective entropy bits
  const rawEntropy = length * Math.log2(charsetSize);
  const effectiveEntropy = Math.max(2, rawEntropy - penaltyBits);
  const totalCombinations = Math.pow(2, effectiveEntropy);

  // Average attempts required for brute force is totalCombinations / 2
  const avgAttempts = totalCombinations / 2;

  // Hashing speed: 100 Billion (10^11) guesses per second (Offline GPU cluster)
  const guessesPerSecond = 1e11;
  const seconds = avgAttempts / guessesPerSecond;

  return formatTimeString(seconds);
}

function formatTimeString(seconds) {
  if (seconds < 0.001) return 'Instant (under 1 millisecond)';
  if (seconds < 1) return 'Instant (under 1 second)';
  if (seconds < 60) return `${Math.round(seconds)} Seconds`;
  
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} Minutes`;
  
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} Hours`;
  
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} Days`;
  
  const years = days / 365;
  if (years < 1000) return `${Math.round(years).toLocaleString()} Years`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)} Thousand Years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)} Million Years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)} Billion Years`;
  if (years < 1e15) return `${(years / 1e12).toFixed(1)} Trillion Years`;
  return 'Quadrillions of Years (Unbreakable)';
}

// --- Pattern & Vulnerability Detector ---
function detectPatterns(pwd) {
  const lower = pwd.toLowerCase();
  const tips = [];
  let penalty = 0;

  if (pwd.length === 0) {
    return { penalty: 0, tips: [] };
  }

  // 1. Common Dictionary Passwords
  for (let common of COMMON_PASSWORDS) {
    if (lower.includes(common)) {
      penalty += 25;
      tips.push(`Contains common dictionary word "${common}". Vulnerable to dictionary attacks.`);
      break;
    }
  }

  // 2. Keyboard Patterns
  for (let pattern of KEYBOARD_PATTERNS) {
    if (lower.includes(pattern)) {
      penalty += 20;
      tips.push(`Contains predictable keyboard sequence "${pattern}".`);
      break;
    }
  }

  // 3. Repeating Characters (e.g. "aaaa", "1111")
  if (/(.)\1{2,}/.test(pwd)) {
    penalty += 15;
    tips.push('Contains 3 or more repeating characters in a row.');
  }

  // 4. Sequential Numbers or Letters (e.g. "123", "abc")
  if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi)/i.test(pwd)) {
    penalty += 12;
    tips.push('Contains predictable sequential numbers or letters (e.g., "123" or "abc").');
  }

  // 5. Common Leetspeak Substitutions
  if (/[@4]dm[!1]n|p[@a]ssw[0o]rd|w[3e]lc[0o]m[3e]/i.test(pwd)) {
    penalty += 18;
    tips.push('Uses predictable leetspeak substitutions (e.g. replacing "o" with "0" or "a" with "@").');
  }

  return { penalty, tips };
}

function renderAIInsights(pwd, patternAnalysis, reqLength, reqUpper, reqLower, reqNumber, reqSymbol) {
  const insightsList = document.getElementById('aiInsightsList');

  if (pwd.length === 0) {
    insightsList.innerHTML = '<p class="ai-insight-placeholder">Start typing a password to generate AI vulnerability feedback and pattern analysis...</p>';
    return;
  }

  const items = [];

  // Add pattern warnings
  patternAnalysis.tips.forEach(tip => {
    items.push(`<div class="ai-tip-item"><i class="fa-solid fa-triangle-exclamation"></i> <span>${tip}</span></div>`);
  });

  // Structural advice
  if (!reqLength) {
    items.push('<div class="ai-tip-item"><i class="fa-solid fa-ruler-horizontal"></i> <span>Password is under 8 characters. Modern GPUs can crack this rapidly regardless of complexity.</span></div>');
  }
  if (!reqSymbol) {
    items.push('<div class="ai-tip-item"><i class="fa-solid fa-hashtag"></i> <span>Add special characters (@, $, %, !) to dramatically widen the search space.</span></div>');
  }
  if (!reqNumber) {
    items.push('<div class="ai-tip-item"><i class="fa-solid fa-calculator"></i> <span>Include numbers to prevent simple word-list matching.</span></div>');
  }

  // Positive feedback if strong
  if (items.length === 0 && pwd.length >= 12) {
    items.push('<div class="ai-tip-item" style="border-left-color: #10b981;"><i class="fa-solid fa-shield-check" style="color: #10b981;"></i> <span>Excellent entropy! High length, zero obvious patterns, and rich character variation.</span></div>');
  }

  insightsList.innerHTML = items.join('');
}

// --- AI Smart Auto-Strengthen ---
function autoFixPassword() {
  const input = document.getElementById('passwordInput');
  let current = input.value;

  if (!current || current.length < 4) {
    // Generate a fresh strong password if empty or very short
    current = generateRandomString(16, true, true, true, true, false);
  } else {
    // Intelligently transform the password while keeping parts recognizable
    let transformed = current;

    // Capitalize first char if lower
    if (!/[A-Z]/.test(transformed)) {
      transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
    }
    // Inject symbol if missing
    if (!/[@$%!^&*]/.test(transformed)) {
      const symbols = ['@', '$', '%', '!', '#', '&', '*'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      transformed += sym;
    }
    // Inject numbers if missing
    if (!/[0-9]/.test(transformed)) {
      const randNum = Math.floor(100 + Math.random() * 900);
      transformed += randNum;
    }
    // Pad length if under 12
    if (transformed.length < 12) {
      const extraChars = generateRandomString(12 - transformed.length, true, true, true, true, false);
      transformed += extraChars;
    }

    current = transformed;
  }

  input.value = current;
  evaluatePassword(current);
  showToast('Password strengthened with AI Auto-Fix!');
}

// ==========================================================================
// PART 2: SMART PASSWORD GENERATOR
// ==========================================================================

function onSliderLengthChange(val) {
  document.getElementById('lengthVal').innerText = val;
  generatePassword();
}

function applyPreset(presetMode) {
  const btns = document.querySelectorAll('.preset-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }

  const slider = document.getElementById('lengthSlider');
  const chkUpper = document.getElementById('chkUpper');
  const chkLower = document.getElementById('chkLower');
  const chkNumber = document.getElementById('chkNumber');
  const chkSymbol = document.getElementById('chkSymbol');
  const chkExcludeAmbiguous = document.getElementById('chkExcludeAmbiguous');
  const personalCard = document.getElementById('personalInputsCard');

  if (personalCard) {
    personalCard.style.display = 'flex';
  }

  if (presetMode === 'personal') {
    slider.value = 16;
    chkUpper.checked = true;
    chkLower.checked = true;
    chkNumber.checked = true;
    chkSymbol.checked = true;
    generatePersonalizedPassword();
    return;
  }

  if (presetMode === 'secure') {
    slider.value = 18;
    chkUpper.checked = true;
    chkLower.checked = true;
    chkNumber.checked = true;
    chkSymbol.checked = true;
    chkExcludeAmbiguous.checked = false;
  } else if (presetMode === 'memorable') {
    slider.value = 20;
    chkUpper.checked = true;
    chkLower.checked = true;
    chkNumber.checked = true;
    chkSymbol.checked = true;
    chkExcludeAmbiguous.checked = false;
  } else if (presetMode === 'readable') {
    slider.value = 16;
    chkUpper.checked = true;
    chkLower.checked = true;
    chkNumber.checked = true;
    chkSymbol.checked = false;
    chkExcludeAmbiguous.checked = true;
  } else if (presetMode === 'pin') {
    slider.value = 6;
    chkUpper.checked = false;
    chkLower.checked = false;
    chkNumber.checked = true;
    chkSymbol.checked = false;
    chkExcludeAmbiguous.checked = false;
  }

  document.getElementById('lengthVal').innerText = slider.value;
  generatePassword(presetMode);
}

function generatePassword() {
  const nameVal = document.getElementById('personalName')?.value.trim();
  const dobVal = document.getElementById('personalDob')?.value;

  // Animate refresh icon
  const icon = document.getElementById('refreshGenIcon');
  if (icon) {
    icon.classList.add('fa-spin');
    setTimeout(() => icon.classList.remove('fa-spin'), 300);
  }

  // Always utilize personalized generator when Name or DOB is provided
  if (nameVal || dobVal) {
    generatePersonalizedPassword();
  } else {
    // Standard random generator fallback if name/dob empty
    const length = parseInt(document.getElementById('lengthSlider').value, 10);
    const incUpper = document.getElementById('chkUpper').checked;
    const incLower = document.getElementById('chkLower').checked;
    const incNumber = document.getElementById('chkNumber').checked;
    const incSymbol = document.getElementById('chkSymbol').checked;
    const excAmbiguous = document.getElementById('chkExcludeAmbiguous').checked;

    const pwd = generateRandomString(length, incUpper, incLower, incNumber, incSymbol, excAmbiguous);
    const genInput = document.getElementById('generatedPassword');
    genInput.value = pwd;
    updateGeneratorPreview(pwd);
  }
}

function generatePersonalizedPassword() {
  const nameInput = document.getElementById('personalName').value.trim();
  const dobInput = document.getElementById('personalDob').value;
  const symbolInput = document.getElementById('personalSymbol').value || '@';

  // 1. Name Component Processing
  let namePart = nameInput || 'CyberShield';
  // Capitalize first letter, ensure case mix
  namePart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  
  // Smart Leetspeak or character transformation (e.g., 'a' -> '@' or 'i' -> '!')
  let transformedName = namePart;
  if (transformedName.toLowerCase().includes('a')) {
    transformedName = transformedName.replace(/a/i, symbolInput);
  } else if (transformedName.toLowerCase().includes('i')) {
    transformedName = transformedName.replace(/i/i, '!');
  } else if (transformedName.toLowerCase().includes('e')) {
    transformedName = transformedName.replace(/e/i, '3');
  }

  // 2. Date of Birth Component Processing
  let dobPart = '';
  if (dobInput) {
    const parts = dobInput.split('-'); // Format: YYYY-MM-DD
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      // Combine day/month or year
      const dobFormats = [
        `${day}${month}`,
        `${year}`,
        `${day}${year.slice(2)}`,
        `${month}${day}`
      ];
      dobPart = dobFormats[Math.floor(Math.random() * dobFormats.length)];
    } else {
      dobPart = dobInput.replace(/\D/g, '');
    }
  }
  if (!dobPart) {
    // Default fallback numbers
    dobPart = String(Math.floor(1990 + Math.random() * 32));
  }

  // 3. Special Character Component
  const specSymbol = symbolInput;

  // 4. Entropy Booster Salt (Random upper/lower/symbol prefix or suffix)
  const saltPrefix = generateRandomString(2, true, true, false, false, false);
  const saltSuffix = generateRandomString(3, true, true, true, true, false);

  // Combine the 3 user parts (Name + DOB + Special Char) + Salt for maximum strength
  const combinedVariations = [
    `${saltPrefix}${specSymbol}${transformedName}${specSymbol}${dobPart}${saltSuffix}`,
    `${namePart}${specSymbol}${dobPart}${saltSuffix}`,
    `${dobPart}${specSymbol}${transformedName}${specSymbol}${saltPrefix}`,
    `${saltPrefix}${namePart}${dobPart}${specSymbol}${saltSuffix}`
  ];

  const finalPersonalPwd = combinedVariations[Math.floor(Math.random() * combinedVariations.length)];

  const genInput = document.getElementById('generatedPassword');
  if (genInput) {
    genInput.value = finalPersonalPwd;
  }

  updateGeneratorPreview(finalPersonalPwd);
  showToast('Generated personalized password from Name + DOB + Symbol!');
}

function generateMemorablePassphrase() {
  const w1 = MEMORABLE_WORDS[Math.floor(Math.random() * MEMORABLE_WORDS.length)];
  const w2 = MEMORABLE_WORDS[Math.floor(Math.random() * MEMORABLE_WORDS.length)];
  const w3 = MEMORABLE_WORDS[Math.floor(Math.random() * MEMORABLE_WORDS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  const syms = ['@', '#', '$', '%', '!', '&'];
  const sym = syms[Math.floor(Math.random() * syms.length)];

  return `${w1}-${w2}-${num}${sym}${w3}`;
}

function generateRandomString(length, incUpper, incLower, incNumber, incSymbol, excAmbiguous) {
  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lower = 'abcdefghijklmnopqrstuvwxyz';
  let number = '0123456789';
  let symbol = SYMBOLS_POOL;

  if (excAmbiguous) {
    upper = upper.replace(/[IO]/g, '');
    lower = lower.replace(/[il|o]/g, '');
    number = number.replace(/[01]/g, '');
  }

  let pool = '';
  const requiredChars = [];

  if (incUpper && upper.length > 0) {
    pool += upper;
    requiredChars.push(getRandomChar(upper));
  }
  if (incLower && lower.length > 0) {
    pool += lower;
    requiredChars.push(getRandomChar(lower));
  }
  if (incNumber && number.length > 0) {
    pool += number;
    requiredChars.push(getRandomChar(number));
  }
  if (incSymbol && symbol.length > 0) {
    pool += symbol;
    requiredChars.push(getRandomChar(symbol));
  }

  if (pool.length === 0) return 'Select at least 1 set';

  const result = [];
  for (let i = 0; i < length - requiredChars.length; i++) {
    result.push(getRandomChar(pool));
  }

  // Combine and shuffle required chars
  const fullArray = [...requiredChars, ...result];
  shuffleArray(fullArray);

  return fullArray.join('');
}

function getRandomChar(str) {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return str.charAt(array[0] % str.length);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const j = array[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function updateGeneratorPreview(pwd) {
  let charsetSize = 0;
  if (/[a-z]/.test(pwd)) charsetSize += 26;
  if (/[A-Z]/.test(pwd)) charsetSize += 26;
  if (/[0-9]/.test(pwd)) charsetSize += 10;
  if (/[@$%!^&*#\-_+=~`<>?/{}\[\]\\|:;,"']/.test(pwd)) charsetSize += 32;

  const length = pwd.length;
  const entropy = Math.round(length * Math.log2(Math.max(2, charsetSize)));
  const crackTime = calculateTimeToCrack(charsetSize, length, 0);

  document.getElementById('genTimeCrack').innerText = crackTime;
  document.getElementById('genEntropy').innerText = `${entropy} bits`;
}

function transferToChecker() {
  const pwd = document.getElementById('generatedPassword').value;
  if (!pwd) return;

  const input = document.getElementById('passwordInput');
  input.value = pwd;
  switchTab('checker');
  evaluatePassword(pwd);
  showToast('Password loaded into Strength Checker!');
}

// ==========================================================================
// UTILITY FUNCTIONS (Clipboard, Visibility, Toast)
// ==========================================================================

function togglePasswordVisibility() {
  const input = document.getElementById('passwordInput');
  const btnIcon = document.querySelector('#togglePasswordBtn i');

  if (input.type === 'password') {
    input.type = 'text';
    btnIcon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    btnIcon.className = 'fa-solid fa-eye';
  }
}

function copyInputPassword() {
  const pwd = document.getElementById('passwordInput').value;
  if (!pwd) return;
  navigator.clipboard.writeText(pwd);
  showToast('Password copied to clipboard!');
}

function copyGeneratedPassword() {
  const pwd = document.getElementById('generatedPassword').value;
  if (!pwd) return;
  navigator.clipboard.writeText(pwd);
  showToast('Generated password copied to clipboard!');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
