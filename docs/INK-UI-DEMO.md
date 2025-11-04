# Ink UI Interactive Demo

**Version:** 2.3.6+
**Status:** Production Ready
**Last Updated:** November 3, 2025

---

## 🎨 Interactive UI Demo Ekranı

Context Manager'ın tüm Ink UI component'lerini test edebileceğiniz interaktif bir demo uygulaması.

## 🚀 Hızlı Başlangıç

### Çalıştırma

```bash
# NPM script ile (önerilen)
npm run test:ink

# Veya direkt
node test/test-ink-ui.js
```

### Gereksinimler

- ✅ Node.js 14+
- ✅ Ink dependencies yüklü (`npm install`)
- ✅ Interactive terminal (iTerm2, Terminal.app, gnome-terminal)
- ❌ VSCode integrated terminal (Raw mode desteklemiyor)

---

## 📋 Demo Menüsü

Test ekranını başlattığınızda şu menü gelecek:

```
╔══════════════════════════════════════════════════════════╗
║ 🎨 Ink UI Test Screen                                   ║
║                                                          ║
║ Select a test to run:                                    ║
║                                                          ║
║ ❯ 🎨 Test Colors                                         ║
║   📊 Test Progress Bar                                   ║
║   🔄 Test Spinners                                       ║
║   📝 Test Input                                          ║
║   🧙 Test Wizard                                         ║
║   📈 Test Dashboard                                      ║
║   ❌ Exit                                                 ║
║                                                          ║
║ [↑↓] Navigate  [Enter] Select  [Q] Quit                  ║
╚══════════════════════════════════════════════════════════╝
```

### Keyboard Kontrolleri

| Tuş | Aksiyon |
|-----|---------|
| `↑` | Yukarı git |
| `↓` | Aşağı git |
| `Enter` | Seç |
| `Q` | Çıkış |
| `Esc` | Çıkış |

---

## 🎯 Test Seçenekleri

### 1. 🎨 Test Colors

Tüm renk paleti ve text stilleri:

```
🌈 Color Test

🔴 Red Text
🟢 Green Text
🟡 Yellow Text
🔵 Blue Text
🟣 Magenta Text
🔷 Cyan Text

✨ Bold 🌑 Dim
```

**Test Edilen:**
- Color options: red, green, yellow, blue, magenta, cyan
- Text styles: bold, dim, italic, underline
- Color combinations

### 2. 📊 Test Progress Bar

Animasyonlu progress bar:

```
📈 Progress Bar Test

Progress: 67%
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░
⏳ Processing...
```

**Özellikler:**
- Real-time progress (0% → 100%)
- Visual bar with filled/empty states
- Auto-completes in ~4 seconds
- Percentage display

### 3. 🔄 Test Spinners

Multiple spinner types:

```
🔄 Spinner Test

⠋ Scanning files...
⠙ Calculating tokens...
✓ Analysis complete!
```

**Spinner Types:**
- Dots spinner (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
- Line spinner (-\|/)
- Status indicators (○ ⏳ ✓ ✗)

### 4. 📝 Test Input

Interactive text input:

```
📝 Text Input Test

Enter your name:
Hakki▊

Hello, Hakki! 👋
```

**Test Edilen:**
- Live typing
- onChange events
- Placeholder text
- Real-time feedback

### 5. 🧙 Test Wizard

Full wizard flow (3 steps):

```
🧙 Context Generation Wizard

What are you working on today?

❯ 🐛 Bug Fix
  ✨ New Feature
  👀 Code Review
  ...
```

**Steps:**
1. Use Case Selection → 7 options
2. Target Model → 6 AI models
3. Output Format → 6 formats
4. Summary & Complete

### 6. 📈 Test Dashboard

Live stats dashboard:

```
📊 Live Analysis Dashboard (complete)

Files: 64    Methods: -    Tokens: 181,480
Size: 0.75 MB    Lines: 28,721    Avg: 2,836 tok/file

Top Languages:
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ .js (64 files)

Largest Files:
  • server.js 12,388 tokens  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (6.8%)
  • handler.js 11,007 tokens  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (6.1%)
  • security.js 7,814 tokens  ▓▓▓▓▓▓▓▓▓▓▓▓▓ (4.3%)

┌────────────────────────────────────────────────────────┐
│ [R] Refresh  [S] Save  [E] Export  [Q] Quit            │
└────────────────────────────────────────────────────────┘
```

**Özellikler:**
- Real-time stats
- Visual graphs with bars
- Language distribution
- Top files ranking
- Keyboard controls

---

## 🐛 Troubleshooting

### "Raw mode is not supported"

**Sorun:**
```
ERROR Raw mode is not supported on the current process.stdin
```

**Çözüm:**
Bu hata **automated test environment**'ta normal. Interactive terminal'de çalışmayacak.

**Nerede Çalışır:**
- ✅ iTerm2 (macOS)
- ✅ Terminal.app (macOS)
- ✅ gnome-terminal (Linux)
- ✅ Windows Terminal
- ✅ PowerShell (Windows)

**Nerede Çalışmaz:**
- ❌ VSCode integrated terminal
- ❌ CI/CD pipelines
- ❌ SSH sessions (bazı durumlarda)
- ❌ Piped input/output

### Çözüm:

```bash
# iTerm2 veya Terminal.app aç
open -a iTerm
# Veya
open -a Terminal

# Demo'yu çalıştır
npm run test:ink
```

### Dependencies Missing

```bash
# Tüm dependencies'i yükle
npm install

# Veya sadece Ink
npm install ink react ink-select-input ink-spinner ink-text-input
```

---

## 💻 Terminalinizde Deneyin

### macOS

```bash
# iTerm2 (önerilen)
open -a iTerm
cd /path/to/context-manager
npm run test:ink

# Terminal.app
open -a Terminal
cd /path/to/context-manager
npm run test:ink
```

### Linux

```bash
# GNOME Terminal
gnome-terminal -- bash -c "cd /path/to/context-manager && npm run test:ink"

# Konsole (KDE)
konsole -e "cd /path/to/context-manager && npm run test:ink"
```

### Windows

```powershell
# Windows Terminal (önerilen)
wt.exe -d C:\path\to\context-manager npm run test:ink

# PowerShell
cd C:\path\to\context-manager
npm run test:ink
```

---

## 🎯 Ne Test Ediliyor?

### Component'ler
- ✅ Box (layout, flexbox, borders, padding)
- ✅ Text (colors, styles, formatting)
- ✅ SelectInput (navigation, selection)
- ✅ TextInput (typing, onChange)
- ✅ Spinner (animations, types)
- ✅ Newline, Spacer

### Features
- ✅ State management (useState)
- ✅ Effects (useEffect for animations)
- ✅ Input handling (useInput)
- ✅ Conditional rendering
- ✅ Component composition
- ✅ Props injection (ESM workaround)

### Custom Components
- ✅ Wizard (3-step flow)
- ✅ Dashboard (live stats)
- ✅ ProgressBar (with components prop)

---

## 📚 İlgili Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `test/test-ink-ui.js` | Interactive demo app |
| `test/INK-UI-TEST-README.md` | Kullanım kılavuzu |
| `lib/ui/wizard.js` | Wizard component |
| `lib/ui/dashboard.js` | Dashboard component |
| `lib/ui/progress-bar.js` | Progress bar component |
| `docs/WIZARD-DASHBOARD-SETUP.md` | Setup guide |

---

## 🎬 Demo Video Çekmek İçin

1. **Terminal'i aç** (iTerm2 önerilen)
2. **Ekranı temizle:** `clear`
3. **Demo'yu başlat:** `npm run test:ink`
4. **Menüden seç:** Colors → Progress → Wizard → Dashboard
5. **Kaydı durdur:** `Q` tuşuna bas

---

## ✅ Başarı Kriterleri

Test screen başarılı sayılır eğer:

1. ✅ Menü render ediliyor
2. ✅ Oklar ile navigate edilebiliyor
3. ✅ Seçimler çalışıyor
4. ✅ Her test ekranı görüntüleniyor
5. ✅ Wizard 3 adımı tamamlanabiliyor
6. ✅ Dashboard stats gösteriyor
7. ✅ Q ile çıkış çalışıyor

---

## 🚀 Production Kullanım

Demo başarılıysa, gerçek wizard ve dashboard hazır:

```bash
# Production wizard
context-manager --wizard

# Production dashboard
context-manager --dashboard
```

---

**Version:** 2.3.6+
**Ink Version:** 4.4.1
**Requires:** Interactive TTY terminal
**Not Supported:** VSCode integrated terminal, CI/CD
