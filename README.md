# 🍽️ Kya Banaye - PWA Meal Suggester

AI-powered Indian meal suggester with:
- 🌤️ Auto weather detection
- 🔔 Scheduled meal reminders (Breakfast 7am, Lunch 11am, Snack 4pm, Dinner 7pm)
- 🤖 Claude AI powered recipe suggestions
- 📱 Installable as mobile app (PWA)

---

## 🚀 Deploy on Vercel (Free, 10 minutes)

### Step 1: GitHub pe daalo
```bash
git init
git add .
git commit -m "Kya Banaye PWA"
```
GitHub pe new repository banao: https://github.com/new
```bash
git remote add origin https://github.com/TUMHARA_USERNAME/kya-banaye.git
git push -u origin main
```

### Step 2: Vercel pe deploy karo
1. https://vercel.com pe jaao → "Sign up with GitHub"
2. "New Project" → apna repo select karo
3. Framework: **Create React App** auto-detect hoga
4. **Environment Variables** mein add karo:
   - Name: `REACT_APP_CLAUDE_KEY`
   - Value: `sk-ant-...` (tumhari Claude API key)
5. "Deploy" click karo — 2 minute mein live ho jaayega!

### Step 3: Phone pe install karo (Android)
1. Vercel se mila URL Chrome mein kholo
2. Menu (3 dots) → "Add to Home Screen"
3. Done! 🎉 Ab icon home screen pe aayega

### Step 4: Notifications enable karo
1. App kholo → Settings (⚙️) → "Notifications Enable Karo"
2. "Allow" karo
3. Ab 7am, 11am, 4pm, 7pm pe automatic reminder milegi!

---

## 💰 Cost

| Service | Cost |
|---------|------|
| Vercel Hosting | FREE forever |
| Open-Meteo Weather API | FREE forever |
| Claude API (suggestions only) | ~₹20-25/month |

---

## 🔑 Claude API Key kaise milegi

1. https://console.anthropic.com pe jaao
2. Sign up karo → "API Keys" → "Create Key"
3. Minimum $5 credit kharidna hoga (1+ saal chalega)
4. Key ko Vercel environment variable mein daalo YA app settings mein

---

## 📁 Project Structure

```
kya-banaye/
├── public/
│   ├── index.html      # PWA meta tags
│   ├── manifest.json   # App install config
│   └── sw.js           # Service worker (notifications + offline)
├── src/
│   ├── App.js          # Main app
│   └── index.js        # Entry point
├── package.json
└── vercel.json
```
