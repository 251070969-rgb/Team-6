"""
==========================================================================
CyberShield AI - Flask Backend API & Web Server for Render Deployment
==========================================================================
Provides REST API endpoints and serves static frontend files for Render.com deployment.
"""

import os
import math
import re
import secrets
import string
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

COMMON_PASSWORDS = {
    'password', '123456', '123456789', '12345678', '12345', 'qwerty', 'password1',
    '111111', '1234567', 'dragon', 'welcome', 'admin', 'football', 'monkey',
    'shadow', 'master', 'sunshine', 'princess', 'letmein', 'trustno1', 'iloveyou'
}

KEYBOARD_PATTERNS = [
    'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
    '123456', '234567', '345678', '456789', '567890', '987654', '876543'
]

SYMBOLS_POOL = '@$%!^&*#-_+=~`<>?/{}\\|:;'

def analyze_password(pwd):
    length = len(pwd)
    req_length = length >= 8
    req_upper = bool(re.search(r'[A-Z]', pwd))
    req_lower = bool(re.search(r'[a-z]', pwd))
    req_number = bool(re.search(r'[0-9]', pwd))
    req_symbol = bool(re.search(r'[@$%!^&*#\-_+=~`<>?/{}\[\]\\|:;,"\']', pwd))

    charset_size = 0
    if req_lower: charset_size += 26
    if req_upper: charset_size += 26
    if req_number: charset_size += 10
    if req_symbol: charset_size += 32

    raw_entropy = length * math.log2(max(2, charset_size)) if length > 0 else 0

    lower_pwd = pwd.lower()
    tips = []
    penalty = 0

    for common in COMMON_PASSWORDS:
        if common in lower_pwd:
            penalty += 25
            tips.append(f'Contains common dictionary word "{common}". Vulnerable to dictionary attacks.')
            break

    for pat in KEYBOARD_PATTERNS:
        if pat in lower_pwd:
            penalty += 20
            tips.append(f'Contains predictable keyboard sequence "{pat}".')
            break

    if re.search(r'(.)\1{2,}', pwd):
        penalty += 15
        tips.append('Contains 3 or more repeating characters in a row.')

    if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi)', lower_pwd):
        penalty += 12
        tips.append('Contains predictable sequential numbers or letters.')

    if re.search(r'[@4]dm[!1]n|p[@a]ssw[0o]rd|w[3e]lc[0o]m[3e]', lower_pwd):
        penalty += 18
        tips.append('Uses predictable leetspeak substitutions.')

    effective_entropy = max(0, int(round(raw_entropy - penalty)))
    
    score = 0
    if length > 0:
        passed_rules = sum([req_length, req_upper, req_lower, req_number, req_symbol])
        score += (passed_rules / 5.0) * 40.0
        entropy_score = min(60.0, (effective_entropy / 80.0) * 60.0)
        score += entropy_score
        score = max(5, min(100, int(round(score - penalty / 2.0))))

    crack_time_str = calculate_time_to_crack(charset_size, length, penalty)

    return {
        'password': pwd,
        'length': length,
        'charset_size': charset_size,
        'raw_entropy': int(round(raw_entropy)),
        'effective_entropy': effective_entropy,
        'score': score,
        'time_to_crack': crack_time_str,
        'rules': {
            'min_length': req_length,
            'has_uppercase': req_upper,
            'has_lowercase': req_lower,
            'has_number': req_number,
            'has_symbol': req_symbol
        },
        'pattern_penalty': penalty,
        'ai_tips': tips
    }

def calculate_time_to_crack(charset_size, length, penalty_bits=0):
    if length == 0 or charset_size == 0:
        return '---'
    raw_entropy = length * math.log2(charset_size)
    effective_entropy = max(2.0, raw_entropy - penalty_bits)
    total_combinations = math.pow(2.0, effective_entropy)
    avg_attempts = total_combinations / 2.0
    guesses_per_sec = 1e11
    seconds = avg_attempts / guesses_per_sec

    if seconds < 0.001:
        return 'Instant (under 1 millisecond)'
    if seconds < 1:
        return 'Instant (under 1 second)'
    if seconds < 60:
        return f'{int(round(seconds))} Seconds'
    minutes = seconds / 60.0
    if minutes < 60:
        return f'{int(round(minutes))} Minutes'
    hours = minutes / 60.0
    if hours < 24:
        return f'{int(round(hours))} Hours'
    days = hours / 24.0
    if days < 365:
        return f'{int(round(days))} Days'
    years = days / 365.0
    if years < 1000:
        return f'{int(round(years)):,} Years'
    if years < 1e6:
        return f'{(years / 1000.0):.1f} Thousand Years'
    if years < 1e9:
        return f'{(years / 1e6):.1f} Million Years'
    if years < 1e12:
        return f'{(years / 1e9):.1f} Billion Years'
    if years < 1e15:
        return f'{(years / 1e12):.1f} Trillion Years'
    return 'Quadrillions of Years (Unbreakable)'

def generate_random_password(length=16, inc_upper=True, inc_lower=True, inc_number=True, inc_symbol=True, exc_ambiguous=False):
    upper = string.ascii_uppercase
    lower = string.ascii_lowercase
    numbers = string.digits
    symbols = SYMBOLS_POOL

    if exc_ambiguous:
        upper = upper.replace('I', '').replace('O', '')
        lower = lower.replace('i', '').replace('l', '').replace('o', '')
        numbers = numbers.replace('0', '').replace('1', '')

    pool = ''
    req_chars = []
    if inc_upper and upper:
        pool += upper
        req_chars.append(secrets.choice(upper))
    if inc_lower and lower:
        pool += lower
        req_chars.append(secrets.choice(lower))
    if inc_number and numbers:
        pool += numbers
        req_chars.append(secrets.choice(numbers))
    if inc_symbol and symbols:
        pool += symbols
        req_chars.append(secrets.choice(symbols))

    if not pool:
        pool = string.ascii_letters + string.digits

    remaining_len = max(0, length - len(req_chars))
    result = req_chars + [secrets.choice(pool) for _ in range(remaining_len)]
    secrets.SystemRandom().shuffle(result)
    return ''.join(result)

def generate_personal_password(name, dob, symbol):
    name_part = (name.strip() or 'CyberShield').capitalize()
    
    transformed_name = name_part
    if 'a' in transformed_name.lower():
        transformed_name = re.sub(r'a', symbol, transformed_name, flags=re.IGNORECASE)
    elif 'i' in transformed_name.lower():
        transformed_name = re.sub(r'i', '!', transformed_name, flags=re.IGNORECASE)
    elif 'e' in transformed_name.lower():
        transformed_name = re.sub(r'e', '3', transformed_name, flags=re.IGNORECASE)

    dob_part = ''
    if dob:
        digits = re.sub(r'\D', '', dob)
        if len(digits) >= 4:
            dob_part = digits[-4:]
        else:
            dob_part = digits
    if not dob_part:
        dob_part = str(secrets.randbelow(30) + 1995)

    prefix = generate_random_password(2, True, True, False, False)
    suffix = generate_random_password(3, True, True, True, True)

    variations = [
        f"{prefix}{symbol}{transformed_name}{symbol}{dob_part}{suffix}",
        f"{name_part}{symbol}{dob_part}{suffix}",
        f"{dob_part}{symbol}{transformed_name}{symbol}{prefix}",
        f"{prefix}{name_part}{dob_part}{symbol}{suffix}"
    ]

    return secrets.choice(variations)

# Static Frontend Route
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# REST API Endpoints
@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    body = request.get_json(silent=True) or {}
    pwd = body.get('password', '')
    return jsonify(analyze_password(pwd))

@app.route('/api/generate', methods=['POST'])
def api_generate():
    body = request.get_json(silent=True) or {}
    length = int(body.get('length', 16))
    inc_upper = body.get('upper', True)
    inc_lower = body.get('lower', True)
    inc_number = body.get('number', True)
    inc_symbol = body.get('symbol', True)
    exc_ambiguous = body.get('exclude_ambiguous', False)

    pwd = generate_random_password(length, inc_upper, inc_lower, inc_number, inc_symbol, exc_ambiguous)
    return jsonify({'password': pwd, 'analysis': analyze_password(pwd)})

@app.route('/api/generate-personal', methods=['POST'])
def api_generate_personal():
    body = request.get_json(silent=True) or {}
    name = body.get('name', '')
    dob = body.get('dob', '')
    symbol = body.get('symbol', '@')

    pwd = generate_personal_password(name, dob, symbol)
    return jsonify({'password': pwd, 'analysis': analyze_password(pwd)})

@app.route('/api/strengthen', methods=['POST'])
def api_strengthen():
    body = request.get_json(silent=True) or {}
    current_pwd = body.get('password', '')
    if not current_pwd or len(current_pwd) < 4:
        strengthened = generate_random_password(16, True, True, True, True)
    else:
        transformed = current_pwd.capitalize()
        if not re.search(r'[@$%!^&*]', transformed):
            transformed += secrets.choice(['@', '#', '$', '%', '!'])
        if not re.search(r'[0-9]', transformed):
            transformed += str(secrets.randbelow(900) + 100)
        if len(transformed) < 12:
            transformed += generate_random_password(12 - len(transformed), True, True, True, True)
        strengthened = transformed

    return jsonify({'password': strengthened, 'analysis': analyze_password(strengthened)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
