# Anelka — Instrukcje dla Claude

## Projekt
Personalny hub zarządzania życiem dla jednej kobiety. Mobile-first, ciepłe pastele, UI po polsku.

## Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Alembic
- **Frontend**: React 19, Vite 6, Chakra UI v3, React Router v7, TanStack Query v5, zustand v5
- **Infra**: Docker Compose (db, backend, frontend, nginx)
- **AI**: OpenAI API (GPT) — dodawane stopniowo
- **OCR**: Tesseract (lokalnie, język polski)

## Porty (inne projekty zajmują domyślne)
- DB: `5433:5432`
- Backend: `8001:8000`
- Frontend: `3001:3000`
- Nginx: `81:80`, `444:443`
- Apka dostępna pod `http://localhost:81`

## Struktura backendu
```
backend/app/
  main.py           — FastAPI app, rejestracja routerów, GZip, CORS, health check
  config.py         — Settings (env vars, CORS_ORIGINS)
  database.py       — SQLAlchemy engine (pool_pre_ping, pool_recycle), session, Base
  auth/             — JWT auth (setup, login, me)
  calendar/         — wydarzenia, recurrence (RRULE), duplikaty per dzień
  shopping/         — listy zakupów, kategorie, itemy
  expenses/         — wydatki, OCR paragonów
  chores/           — obowiązki, domownicy
  plans/            — cele, plany, bucket lista
  notifications/    — push (pywebpush, VAPID)
  ai/               — OpenAI wrapper, chat, sugestie
  common/           — TimestampMixin, pagination
backend/alembic/    — migracje DB
```

## Struktura frontendu
```
frontend/src/
  App.jsx           — Router + ChakraProvider + QueryClientProvider + ErrorBoundary + CelebrationOverlay
  theme.js          — pastelowa paleta kolorów
  api/              — fetch wrapper z JWT, pliki per moduł
  hooks/
    useAuth.js        — zustand, single-user JWT auth
    useCalendar.js    — TanStack Query, events CRUD
    useEventHistory.js — zustand, undo/redo (max 3 kroki)
    useRewards.js     — zustand, sparks/level/streak, localStorage
    useAchievements.js — zustand, unlocked achievements, progress tracking
    useChallenges.js  — zustand, daily/weekly challenges, claim rewards
    useCelebration.js — zustand, celebration animation triggers (priority + throttling)
    useExpenses.js, useShopping.js — TanStack Query per moduł
  components/
    layout/         — AppShell, BottomNav (mobile), Sidebar (desktop), Header
    auth/           — SetupPage, LoginPage, OnboardingPage, ProtectedRoute
    calendar/       — Kalendarz (kolor: sky/błękit)
      CalendarPage.jsx    — główna strona, sekcje: przegląd dnia + przegląd miesiąca
      CalendarHeader.jsx  — nawigacja miesiąca (< Marzec 2026 >)
      MonthView.jsx       — siatka 7x6, biała karta, zaokrąglone rogi
      DayDetailView.jsx   — widok dnia (na górze), swipe, quick-add szablony
      DayEventsDrawer.jsx — drawer z wydarzeniami dnia
      EventFormDrawer.jsx — formularz (tytuł, start, czas trwania, opis, kolor, powtarzanie)
      EventChip.jsx       — wyświetlanie pojedynczego wydarzenia
      UndoRedoButtons.jsx — cofnij/ponów (max 3 kroki, fixed center-bottom)
    shopping/       — Zakupy (kolor: sage/zieleń)
    expenses/       — Wydatki (kolor: peach/brzoskwinia)
    chores/         — Obowiązki (kolor: lavender/fiolet)
    plans/          — Plany (kolor: rose/róż)
    ai/             — AiChatDrawer, podpowiedzi
    voice/          — VoiceFab (mikrofon), VoiceConfirmationDialog
    common/         — EmptyState, LoadingSpinner, SettingsPage, ErrorBoundary, SparkToast, AchievementToast
    affirmation/    — Avatar system (AffirmationAvatar, AvatarSelectionPage, shared.jsx, avatarConfig.js)
    celebration/    — CelebrationOverlay (imperative particle + glow engine)
    dashboard/      — DashboardPage, AchievementsPage (Gablotka), ChallengesPage (Wyzwania), MoodCheck, widgets
```

## Routing (polskie ścieżki)
```
/setup             — pierwsze uruchomienie (tworzenie konta)
/login             — logowanie
/witaj             — onboarding (welcome + avatar, tylko po pierwszym setup)
/                  — dashboard (główna strona)
/kalendarz         — kalendarz
/zakupy            — listy zakupów
/wydatki           — śledzenie wydatków
/obowiazki         — obowiązki domowe
/plany             — cele i plany
/ustawienia        — ustawienia
/odznaki           — Gablotka (osiągnięcia)
/wyzwania          — Wyzwania (daily/weekly challenges)
/postacie          — Kolekcja postaci afirmacji
```

## API
Wszystkie endpointy pod `/api/`. Wymagają JWT oprócz `/api/auth/setup`, `/api/auth/login`, `/api/auth/status`, `/api/health`.

## Kalendarz — szczegóły implementacji
- **Layout**: przegląd dnia (u góry) → przegląd miesiąca (pod spodem), każda sekcja z bannerem i ramką
- **Quick-add szablony**: Szpital, Klinika, Dzieci, Dyżur, Zejście, Wolne — z predefiniowanymi godzinami/kolorami
- **Duplikaty**: backend blokuje 409 jeśli ten sam `title` już istnieje w danym dniu; frontend wyszarza quick-add buttony
- **Undo/Redo**: zustand store (`useEventHistory`), max 3 kroki wstecz, cofnij create=delete, cofnij delete=recreate, cofnij update=restore
- **Formularz**: tytuł, data+godzina, czas trwania (dropdown 30min-24h), opis, kolor (8 opcji), powtarzanie (RRULE)
- **Usunięte z formularza**: toggle "cały dzień", data zakończenia (zastąpiona czasem trwania), kategoria, miejsce
- **Kolory cyfr**: dni powszednie `#2B5EA7` (ciemny niebieski), weekendy `rose.400`, dziś = białe w kółku `sky.400`
- **Vite HMR**: wymaga `usePolling: true` w Docker na Windows

## Design System — Visual Consistency
Styl wizualny: miękki, ciepły, kobiecy, spokojny, premium. Dashboard i Kalendarz to referencja.

### Karty (cards)
```
bg="white"
borderRadius="2xl"
shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
borderWidth="1px"
borderColor="gray.100"
px={4} py={4}  (kompaktowe wiersze: p={3.5})
```
- NIE używaj `shadow="xs"`, `border="1px solid"`, ani `borderRadius="xl"` na kartach
- Hover: `shadow="0 2px 12px 0 rgba(...)"`  z kolorem modułu, `borderColor` modułu `.300`

### Kolory modułów — przyciski i chipy
| Moduł      | Primary button | Hover      | Chip aktywny | Chip nieaktywny |
|------------|---------------|------------|--------------|-----------------|
| Shopping   | `sage.400`    | `sage.500` | `sage.500`   | `sage.50`       |
| Expenses   | `peach.400`   | `peach.500`| `peach.400`  | `peach.50`      |
| Plans      | `rose.300`    | `rose.400` | `rose.300`   | `rose.50`       |
| Calendar   | (referencja)  | —          | —            | —               |
| Challenges | `lavender.400`| `lavender.500` | `lavender.500` | `lavender.50` |
| Rewards    | gradient `#FCC2D7→#F9915E` | — | `rose.400` | `rose.50`   |

### Elementy UI
- **Search input**: `borderRadius="xl"`, border w kolorze modułu `.200`, focus `.400`
- **Tab bar**: pill-bar container (`bg="moduł.50"`, `borderRadius="xl"`, `p="3px"`), aktywna zakładka `bg="white"` + `shadow="sm"`
- **Empty states**: ikona w kolorze modułu `.200`, nagłówek + ciepły tekst pomocniczy
- **Item rows**: `borderRadius="xl"` (nie "lg")
- **Dialogi**: `borderRadius="2xl"`, `shadow="xl"`, backdrop `blackAlpha.400`

## System nagród i celebracji (SmartMe)
Cały system nagród działa **client-side** (localStorage, zustand). Brak backendu.

### Architektura
- **useRewards** — sparks, level, streak. `reward(action)` przyznaje iskry + sprawdza level up
- **useAchievements** — odznaki odblokowywane automatycznie po spełnieniu warunków. `trackProgress(key, increment, addSparks)`
- **useChallenges** — dzienne/tygodniowe wyzwania. `trackAction(type)`, `claimReward(id, period)`, `claimAllBonus(period)`
- **useCelebration** — animacje celebracji. `celebrate(type, options?)` z priorytetami i throttlingiem

### Celebration types (priorytet rosnąco)
| Typ | Trigger | Cząstki | Czas |
|-----|---------|---------|------|
| `progress` | ukończenie challenge | 3 tiny | 500ms |
| `affirmation` | reveal afirmacji | 6 soft | 800ms |
| `reward` | odebranie nagrody | 10 burst | 1000ms |
| `achievement` | odblokowanie odznaki | 14 halo | 1200ms |
| `levelup` | nowy poziom | 20 full | 1500ms |

API: `useCelebration.getState().celebrate(type, { originX, originY, intensity })`
- Wyższy priorytet zastępuje niższy
- Throttle: progress 3s, affirmation 2s, reward 1.5s, achievement/levelup: bez limitu

### Gablotka (/odznaki) — layout
1. "Twoja kolekcja" (summary)
2. "Postęp kolekcji" (progress bar)
3. "Ostatnio odblokowane" (horizontal scroll)
4. Avatar widget (→ /postacie)
5. Kategorie osiągnięć (collapsed by default, multiple open)
6. Nagrody za poziom (collapsed by default)

### Wyzwania (/wyzwania) — UI
- Dzisiejsze (lavender accent) + Tygodniowe (rose/peach accent), rozdzielone gradient dividerem
- Karty challenge: column layout, icon + title + reward pill → progress bar → CTA
- 3 stany: in progress, completed (ready to claim, pulsujący progress bar), claimed (strikethrough, opacity 0.7)
- Bonus card za komplet z gradient CTA

### Postacie (/postacie)
- Galeria kart avatarów, per-avatar accent colors (luna=rose, sol=peach, nox=lavender, bloom=pink, aura=lavender)
- Aktywny avatar: glow ring, "Aktywna" badge, elevated shadow
- Locked: grayscale + italic opis, "Odblokuj na poziomie X"
- Wybór: local pulse animation (avSelectPulse), badge pop-in (avBadgeIn)
- Odblokowanie przez poziomy w useRewards, zapis w localStorage

### Toasty
- **SparkToast** — "+N Iskier" (top center, pill, auto-dismiss 2.6s)
- **AchievementToast** — odznaki + challenge complete (top center, gradient card, 3.5s)
- Oba montowane globalnie w App.jsx
- **CelebrationOverlay** — imperative DOM particles + glow, nie blokuje UI (pointer-events: none)

## System przejść (Motion System)
Plik: `styles/motion.css`. Premium blur-fade transitions via CSS animations.

### Klasy
| Klasa | Animacja | Czas | Zastosowanie |
|-------|----------|------|-------------|
| `sm-page-enter` | blur(6px) + translateY(6px) → 0 | 620ms | zmiana stron/tabów |
| `sm-fade-in` | blur(3px) + translateY(4px) → 0 | 420ms | zmiana treści wewnątrz strony |
| `sm-card-enter` | translateY(4px) → 0 | 200ms | pojawianie kart/sekcji |
| `sm-slide-right` | translateX(12px) → 0 | 620ms | widoki szczegółów |
| `sm-expand-in` | scaleY(0.97) → 1 | 180ms | akordeony, dropdown |

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` — szybki start, miękkie lądowanie
- GPU-only: opacity, transform, filter
- `prefers-reduced-motion`: wyłącza wszystkie animacje

## System opinii (Feedback)
- Endpoint: `POST /api/feedback` (rate limit: 5/min)
- Model: `message`, `category` (bug/idea/opinion/broken), `email` (opcjonalny), `user_agent`
- Tabela nie ma `user_id` — feedback anonimowy (single-user app)
- Frontend: `FeedbackDialog` w Ustawieniach

## Rate Limiting
- In-memory sliding window per IP
- `/api/auth/setup`: 3/min, `/api/auth/login`: 5/min, `/api/auth/change-password`: 5/min, `/api/feedback`: 5/min

## Voice Commands
- `POST /api/voice/process` — transkrypcja (Whisper) + parsowanie intencji (GPT)
- `POST /api/voice/execute` — wykonanie potwierdzonej akcji
- Max audio: 10 MB, formaty: webm, mp3, wav, ogg, m4a
- Obsługuje: calendar, shopping, expenses, plans (CRUD + list)

## Konwencje
- **Język UI**: polski (wszystkie teksty, komunikaty, placeholdery)
- **Język kodu**: angielski (nazwy zmiennych, funkcji, klas, plików)
- **Polskie znaki w JSX**: ZAWSZE opakowuj w wyrażenia JS `{"tekst z polskimi znakami"}`, NIE wstawiaj `\uXXXX` w surowym tekście JSX — będzie wyświetlony dosłownie
- **Auth**: single-user, pierwszy zarejestrowany = właściciel, potem setup zablokowany
- **Domownicy**: tylko imiona/etykiety (nie osobne konta), 2 osoby
- **Migracje**: Alembic (nie `Base.metadata.create_all`), auto-uruchamiane przy starcie kontenera
- **Nowe modele**: dodaj import w `alembic/env.py` + stwórz migrację + dodaj `Index` na `user_id` i FK
- **Indeksy DB**: każda tabela ma `Index` na `user_id` i kluczowych kolumnach zapytań (date, start_at, list_id, goal_id)
- **Style**: Chakra UI v3, custom tokens w theme.js, każdy moduł ma swój kolor — patrz "Design System" wyżej
- **State**: zustand dla auth/UI/eventHistory, TanStack Query dla server state
- **Porty zajęte**: jeśli port jest zajęty, automatycznie wybierz inny bez pytania
- **Docker HMR (Windows)**: Vite wymaga `usePolling: true` w `vite.config.js` → `server.watch`
- **CORS**: konfigurowalne przez env var `CORS_ORIGINS` (lista origins oddzielona przecinkami)
- **Health check**: `/api/health` weryfikuje połączenie z DB, zwraca 503 gdy baza niedostępna
- **ErrorBoundary**: globalny komponent w App.jsx łapie nieoczekiwane błędy React
- **Caching**: kategorie i members mają `staleTime: 5min`, reszta 30s (domyślne)
- **Kompresja**: GZip na backendzie (FastAPI) + nginx (gzip on)
- **Security headers**: nginx dodaje X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## Fazy implementacji
- [x] Faza 0: Fundament (auth, layout, routing, Alembic)
- [ ] Faza 1: Obowiązki (chores + household_members)
- [x] Faza 2: Zakupy (shopping lists + categories + items)
- [x] Faza 3: Kalendarz (events + recurrence + undo/redo + quick-add + duplikaty)
- [x] Faza 4: Wydatki (expenses + categories + summary + recurring + budget)
- [ ] Faza 5: OCR paragonów (Tesseract)
- [x] Faza 6: Plany (goals, milestones, bucket list)
- [ ] Faza 7: Push Notifications (VAPID, service worker)
- [ ] Faza 8: AI (OpenAI, sugestie, chat)
- [ ] Faza 9: Polish (Google Calendar, PWA, streaming AI)
- [x] Faza R: SmartMe Rewards (sparks, levels, achievements, challenges, celebrations, avatars, affirmations)

## Komendy — lokalne (dev)
```bash
# Start (z katalogu anelka)
docker-compose up --build -d

# Logi
docker logs anelka-backend --tail 30
docker logs anelka-frontend --tail 30

# Restart backendu po zmianach w kodzie (hot-reload powinien działać)
docker restart anelka-backend

# Nowa migracja (wewnątrz kontenera)
docker exec anelka-backend alembic revision --autogenerate -m "opis"
docker exec anelka-backend alembic upgrade head
```

## Deploy na serwer produkcyjny

### Infrastruktura
- **VPS**: Hetzner CX23, Ubuntu, `89.167.123.192`
- **Domena**: `smartme.rafaldebski.com` (DNS A record → VPS IP)
- **SSL**: Let's Encrypt (certbot), auto-renewal nie skonfigurowany — certyfikat ważny do 2026-06-08
- **SSH**: `ssh root@89.167.123.192` (klucz ed25519 z maszyny Rafa)
- **Pliki na serwerze**: `/root/anelka/`
- **Docker Compose prod**: `docker-compose.prod.yml` (porty 80/443, frontend jako static build, certbot)
- **Env prod**: `/root/anelka/.env` (silny SECRET_KEY i DB_PASSWORD, CORS tylko https://smartme.rafaldebski.com)

### Różnice prod vs dev
| | Dev (localhost) | Prod (VPS) |
|---|---|---|
| Compose file | `docker-compose.yml` | `docker-compose.prod.yml` |
| Frontend | Vite dev server (HMR) | Static build (nginx) |
| Frontend Dockerfile | `Dockerfile` | `Dockerfile.prod` |
| Nginx config | `nginx/nginx.conf` | `nginx/nginx.prod.conf` |
| Porty | 81, 8001, 3001, 5433 | 80, 443 (SSL) |
| CORS | localhost:81, localhost:3001 | https://smartme.rafaldebski.com |
| SSL | Brak | Let's Encrypt + HSTS |

### Procedura deploy (krok po kroku)
```bash
# 1. Wypchnij pliki z lokalnej maszyny na serwer (z katalogu anelka)
tar --exclude='node_modules' --exclude='.git' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='pgdata' -czf - . | ssh root@89.167.123.192 "cd /root/anelka && tar xzf -"

# 2. Przebuduj i uruchom kontenery na serwerze
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml up --build -d'

# 3. Poczekaj ~15s na start backendu (migracje Alembic), potem restart nginx
ssh root@89.167.123.192 'sleep 15 && docker restart anelka-nginx'

# 4. Weryfikacja
ssh root@89.167.123.192 'curl -s https://smartme.rafaldebski.com/api/health'
# Oczekiwany wynik: {"status":"ok","database":"ok"}
```

### Odnawianie certyfikatu SSL
```bash
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker restart anelka-nginx'
```

### Logi produkcyjne
```bash
ssh root@89.167.123.192 'docker logs anelka-backend --tail 30'
ssh root@89.167.123.192 'docker logs anelka-nginx --tail 30'
```

### UWAGA: .env produkcyjny
- **NIE nadpisuj** `/root/anelka/.env` na serwerze — zawiera unikalne hasła wygenerowane na VPS
- Lokalne `.env` jest WYŁĄCZONE z tar (`--exclude='.env'`)
- Jeśli trzeba zmienić zmienną, edytuj ręcznie: `ssh root@89.167.123.192 'nano /root/anelka/.env'`
